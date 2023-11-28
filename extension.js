import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';


export default class SimpleBreakReminder extends Extension {
    enable() {
        // Create a panel button
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

        // Add an icon
        const icon = new St.Icon({
            icon_name: 'face-laugh-symbolic',
            style_class: 'system-status-icon',
        });
        this._indicator.add_child(icon);

         // Add a menu item to open the preferences window
        this._indicator.menu.addAction('Preferences', () => this.openPreferences());
        this._indicator.menu.addAction('Reset Timer', () => this.resetTimer());

        this._settings = this.getSettings();

        // Watch for changes to a specific setting
        this._settings.connect('changed::time', (settings, key) => {
            this.resetTimer();
        });

        // Add the indicator to the panel
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        this.resetTimer();
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
            console.log((this._timeOutTime - new Date()) /1000 / 60);
            this.check();
            return GLib.SOURCE_CONTINUE;
        });
    }

    check() {
        const currentTime = new Date();
        if (this._timeOutTime < currentTime) {
            Main.notify('Break reminder', 'Take a break!');
            this.resetTimer();
        }
    }

    resetTimer() {
        const time = this._settings.get_uint('time');
        this._timeOutTime = new Date();
        // SetMinutes manages the overflow 
        this._timeOutTime.setMinutes(this._timeOutTime.getMinutes() + time);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
        this._settings = null;
    }
}

