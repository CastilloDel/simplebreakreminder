import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';


const repaint = (area, percentageDone) => {
    let context = area.get_context();
    const [width, height] = area.get_surface_size();
    const x =  width / 2;
    const y = height / 2;
    const r = width / 2.5;
    context.arc(x, y, r, 0, 2 * Math.PI);
    context.setSourceRGBA(148 / 255, 148 / 255, 148 / 255, 1);
    context.stroke();
    const angleDone = 2 * Math.PI * percentageDone;
    const startPoint = 1.5 * Math.PI;
    const endPoint = (1.5 * Math.PI + angleDone) % (2 * Math.PI);
    context.arc(x, y, r, startPoint, endPoint);
    context.setSourceRGBA(242 / 255, 242 / 255, 242 / 255, 1);
    context.stroke();

    context.$dispose();
}

export default class SimpleBreakReminder extends Extension {
    enable() {
        // Create a panel button
        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

        // Add an icon
        const icon = new St.DrawingArea({ width: 25, height: 25 });
        icon.connect('repaint', (area) => repaint(area, this.calculatePercentageDone()));
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
        GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 5, () => {
            this.check();
            icon.queue_repaint();
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

    calculatePercentageDone() {
        const remainingMinutes = (this._timeOutTime - new Date()) / 1000 / 60;
        const time = this._settings.get_uint('time');
        const remainingPercentage = remainingMinutes / time;
        return 1 - remainingPercentage;
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
        this._settings = null;
    }
}

