# How to enable natural scrolling in linux
Original: [topbug.net](https://www.topbug.net/blog/2017/02/23/enable-natural-scrolling-for-trackpads-using-libinput/)

List input devices:
```
$ xinput --list
⎡ Virtual core pointer                    	id=2	[master pointer  (3)]
⎜   ↳ Virtual core XTEST pointer              	id=4	[slave  pointer  (2)]
⎜   ↳ Logitech G305                           	id=8	[slave  pointer  (2)]
⎜   ↳ HID 0c45:7403                           	id=10	[slave  pointer  (2)]
⎣ Virtual core keyboard                   	id=3	[master keyboard (2)]
    ↳ Virtual core XTEST keyboard             	id=5	[slave  keyboard (3)]
    ↳ Power Button                            	id=6	[slave  keyboard (3)]
    ↳ Power Button                            	id=7	[slave  keyboard (3)]
    ↳ HID 0c45:7403                           	id=9	[slave  keyboard (3)]
    ↳ Logitech StreamCam                      	id=11	[slave  keyboard (3)]
    ↳ Logitech G305                           	id=12	[slave  keyboard (3)]
```

List the props of a device:
```
$ xinput --list-props "pointer:Logitech G305"
Device 'Logitech G305':
	libinput Natural Scrolling Enabled (282):	1
	<...>
```

If there's an output like that, then `libinput` manages the device.

Set natural scrolling:
```
$ xinput --set-prop "pointer:Logitech G305" "libinput Natural Scrolling Enabled" 1
```

Add that line to `~/.xinitrc` or `~/.xsessionrc` to make it automatically take effect upon logging in.
