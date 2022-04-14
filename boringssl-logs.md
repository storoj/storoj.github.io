# [boringssl] Failed to log metrics

I guess every iOS developer must have experienced that issue. Every app that works with https receives these mysterious log messages from `boringssl`:
```
[boringssl] boringssl_metrics_log_metric_block_invoke(151) Failed to log metrics
```

It needs just a one-liner to reproduce the issue:
```
URLSession.shared
  .dataTask(with: URL(string: "https://google.com")!)
  .resume()
```

Stack Overflow, Apple Developer Forum, and others recommend to set `OS_ACTIVITY_MODE=disable`, but it makes things even worse. It silences `boringssl` as well as all your `NSLog`s.

```
// OS_ACTIVITY_MODE=disable

URLSession.shared
  .dataTask(with: URL(string: "https://google.com")!)
  .resume()
NSLog("hello")

// both boringssl and NSLog are silent
```

Let's find where do these logs come from.
```
(lldb) image lookup -r -s "boringssl"
13 symbols match the regular expression 'boringssl' in /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Library/Developer/CoreSimulator/Profiles/Runtimes/iOS.simruntime/Contents/Resources/RuntimeRoot/usr/lib/libnetwork.dylib:
        Address: libnetwork.dylib[0x0000000000090a78] (libnetwork.dylib.__TEXT.__text + 586400)
        Summary: libnetwork.dylib`__nw_protocol_get_boringssl_identifier_block_invoke        Address: libnetwork.dylib[0x0000000000090d1c] (libnetwork.dylib.__TEXT.__text + 587076)
        ...

1251 symbols match the regular expression 'boringssl' in /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Library/Developer/CoreSimulator/Profiles/Runtimes/iOS.simruntime/Contents/Resources/RuntimeRoot/usr/lib/libboringssl.dylib:
        Address: libboringssl.dylib[0x0000000000001dd4] (libboringssl.dylib.__TEXT.__text + 3844)
        Summary: libboringssl.dylib`boringssl_bio_create        Address: libboringssl.dylib[0x0000000000001ea0] (libboringssl.dylib.__TEXT.__text + 4048)
        ...
```

`libboringssl.dylib` sounds promising. I opened it in Hopper Disassembler to find the string constant with the error message, and its usages.

"References To..." pointed to `boringssl_metrics_log_event` function. I am not an expert in assembly, so I switched Hopper to "Pseudo Code Mode" to see the function as plain C code.

It looked like this:
```
int boringssl_metrics_log_event(...) {
  // ...
  if (g_boringssl_log != NULL
      && os_log_type_enabled(g_boringssl_log, OS_LOG_TYPE_ERROR))
  {
    os_log_with_type(
      g_boringssl_log, 
      OS_LOG_TYPE_ERROR, 
      "%s(%d) Failed to log metrics",
      "boringssl_metrics_log_metric_block_invoke",
      0x12
    )
  }
  // ...
}
```

It seems like we could disable all the output by zeroing the value of `g_boringssl_log`. I stopped the running sample app on a breakpoint to check the availability of that variable:
```
(lldb) p g_boringssl_log
(OS_os_log *) $2 = 0x0000600000ac9d80
```

I was surprised to see that the variable is accessible by its name in lldb. Anyways, I changed its value to NULL:
```
(lldb) p g_boringssl_log = 0
(void *) $3 = 0x0000000000000000
```
... and made sure that all the boringssl logs disappeared.

Now I had to find a way to auto-reset the value of that variable on every app launch. That could possibly be achieved without even adding any code to the app – by using breakpoints with actions. I thought I could add a breakpoint that calls `p g_boringssl_log = 0` and check `Automatically continue after evaluating actions`.

However, it did not seem to be possible to add such a breakpoint. The thing is that `libboringssl.dylib` is being loaded dynamically (lazily). That fact makes it impossible to just set a breakpoint on the app's startup function like `main` or `UIApplicationMain` because `boringssl` is not yet loaded, and `g_boringssl_log` is not yet initialized.

So I decided to find the code that initializes `g_boringssl_log`.

I opened the Terminal and ran `lldb` separately from Xcode:
```
% lldb

# break on all functions from libboringssl.dylib
(lldb) breakpoint set -r '.' -s 'libboringssl.dylib'
Breakpoint 1: no locations (pending).
Breakpoint set in dummy target, will get copied into future targets.

# wait for $EXECUTABLE_NAME, to start,
# attach when it starts, and break
(lldb) process attach -n '$EXECUTABLE_NAME' -w

# manually run the app in the Simulator
# lldb must attach and break

Process 25155 stopped
* thread #1, stop reason = signal SIGSTOP
    frame #0: 0x0000000102a58560 dyld`_dyld_start
dyld`_dyld_start:
->  0x102a58560 <+0>:  mov    x0, sp
    0x102a58564 <+4>:  and    sp, x0, #0xfffffffffffffff0
    0x102a58568 <+8>:  mov    x29, #0x0
    0x102a5856c <+12>: mov    x30, #0x0
Target 0: stopped.

Executable module set to "/path/to/executable".
Architecture set to: arm64e-apple-ios-simulator.

# continue, so it breaks on the first function call
(lldb) continue

Process 25155 stopped
* thread #5, queue = 'com.apple.CFNetwork.Connection', stop reason = breakpoint 1.233
    frame #0: 0x0000000185e66c00 libboringssl.dylib`nw_protocol_boringssl_copy_definition
libboringssl.dylib`nw_protocol_boringssl_copy_definition:
->  0x185e66c00 <+0>:  stp    x29, x30, [sp, #-0x10]!
    0x185e66c04 <+4>:  mov    x29, sp
    0x185e66c08 <+8>:  adrp   x8, 337146
    0x185e66c0c <+12>: ldr    x8, [x8, #0xc8]
Target 0: stopped.

# set a watchpoint to g_boringssl_log's address
(lldb) watchpoint set expression &g_boringssl_log
Watchpoint created: Watchpoint 1: addr = 0x1d8360b28 size = 8 state = enabled type = w
    new value: 0x0000000000000000

# disable the breakpoint to let the app running
(lldb) breakpoint disable 1
1 breakpoints disabled.

# continue until the watchpoint hits:
(lldb) continue
Process 25155 resuming

Watchpoint 1 hit:
old value: 0x0000000000000000
new value: 0x0000600000464880
Process 25155 stopped
* thread #5, queue = 'com.apple.CFNetwork.Connection', stop reason = watchpoint 1
    frame #0: 0x0000000185e715dc libboringssl.dylib`__boringssl_log_open_block_invoke + 40
libboringssl.dylib`__boringssl_log_open_block_invoke:
->  0x185e715dc <+40>: mov    x0, x8
    0x185e715e0 <+44>: bl     0x185ee4698               ; symbol stub for: objc_release
    0x185e715e4 <+48>: adrp   x8, 337135
    0x185e715e8 <+52>: ldr    x8, [x8, #0x228]
Target 0: stopped.
```

Now we know that `g_boringssl_log` gets initialized in `__boringssl_log_open_block_invoke`.

Switch back to Hopper Disassembler to find that function and its usages:
```
void boringssl_log_open() {
  static dispatch_once_t onceToken;

  dispatch_once(&onceToken, __boringssl_log_open_block_invoke);

  // with block contents inlined:
  dispatch_once(&onceToken, ^{
    g_boringssl_log = os_log_create("com.apple.network", "boringssl");
  });
}
```

The best idea so far was to `thread return` on `__boringssl_log_open_block_invoke`'s entry. So the body of that function will never be executed, and `g_boringssl_log` will not be initialized.

`boringssl` is not the only bully. There's also `libnetwork.dylib` that spams with `[connection] ... [...] Client called nw_connection_copy_connected_path on unconnected nw_connection` messages.

These logs could also be silenced by adding a similar breakpoint with `thread return` to `____nwlog_connection_log_block_invoke` from `libnetwork.dylib`.
