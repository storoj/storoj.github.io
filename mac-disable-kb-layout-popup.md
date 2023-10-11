# Disable Keyboard Layout Switching Popup in macos
```
sudo sh -c \
    'mkdir -p $(dirname $0) \
    && /usr/libexec/PlistBuddy -c "Add redesigned_text_cursor:Enabled bool false" $0' \
    /Library/Preferences/FeatureFlags/Domain/UIKit.plist
```

and reboot
