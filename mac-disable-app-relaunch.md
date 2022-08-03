# Disable App Relaunch on Mac Reboot
Original: [apple.stackexchange.com](https://apple.stackexchange.com/questions/230719/how-to-disable-app-relaunch-and-window-restore-in-el-capitan-on-reboot)

macOS stores opened apps in `~/Library/Preferences/ByHost/com.apple.loginwindow.{GUID}.plist`.
One of the solutions is to empty the file and to make it write-protected.
```
$ cd ~/Library/Preferences/ByHost

# clean up the file
$ > com.apple.loginwindow.*.plist

# write-protect
$ chflags uimmutable com.apple.loginwindow.*.plist
```
