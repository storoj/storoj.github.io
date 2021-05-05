# How to reverse mouse scrolling direction on Windows 10
Original: [windowscentral.com](https://windowscentral.com/how-reverse-scrolling-direction-windows-10)

1. Go to Device Manager: Win+Brake to open System Settings, then find Device Manager on the left
2. Expand **Mice and other pointing devices**
3. Go to **Properties** of the mouse device
4. Select **Device instance path** property at the Details tab
5. Note the value of the path for the mouse, for example `HID\VID_0C45&PID_7403&MI_01\9&3B16DB25&0&0000`
6. Open the Registry Editor by pressing Win+R, `regedit`
7. Paste the following path into the address bar: `Computer\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Enum\{DEVICE_PATH}\Device Parameters`, where `{DEVICE_PATH}` is the path from the step (5). The full path should look like: `Computer\HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Enum\HID\VID_0C45&PID_7403&MI_01\9&3B16DB25&0&0000\Device Parameters`
8. Set `FlipFlopWheel` DWORD 32-bit value to `1`
9. Restart the PC
