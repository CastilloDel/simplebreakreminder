import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

const REPAINT_SECONDS = 2;
const CHECK_TIMER_SECONDS = 10;

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
        this._indicator.menu.addAction('Reset Timer', () => {
            this.addNewTimer(this._settings.get_uint('time-between-breaks'))
        });

        this._settings = this.getSettings();

        // Watch for changes to a specific setting
        this._settings.connect('changed::time-between-breaks', (settings, key) => {
            this.addNewTimer(this._settings.get_uint('time-between-breaks'));
        });

        // Add the indicator to the panel
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        this.addNewTimer(this._settings.get_uint('time-between-breaks'));
        this._repaintTimeOut = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, REPAINT_SECONDS, () => {
            icon.queue_repaint();
            return GLib.SOURCE_CONTINUE;
        });
        this._checkTimeOut = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, CHECK_TIMER_SECONDS, () => {
            this.check();
            return GLib.SOURCE_CONTINUE;
        });
    }

    check() {
        const currentTime = new Date();
        if (this._timerEnd < currentTime) {
            console.log("Notification");
            const source = new MessageTray.Source(
                'Break',
                'face-laugh-symbolic'
            );
            Main.messageTray.add(source);

            const notification = new MessageTray.Notification(
                source,
                'Break reminder',
                'You should take a break!'
            );
            notification.addAction('I will!', () => {
                console.log("Accept");
                this.addNewTimer(this._settings.get_uint('time-between-breaks'));
            });
            notification.addAction('Wait a bit', () => {
                console.log("Decline");
                this.addNewTimer(this._settings.get_uint('extra-time'));
            });
            notification.setTransient(true);

            source.showNotification(notification);
        }
    }

    addNewTimer(minutes) {
        this._timerStart = new Date();
        this._timerEnd = new Date();
        // SetMinutes manages the overflow 
        this._timerEnd.setMinutes(this._timerStart.getMinutes() + minutes);
    }

    calculatePercentageDone() {
        const time = new Date();
        const done = (time - this._timerStart) /  (this._timerEnd - this._timerStart);
        return Math.min(0.999, done);
    }

    disable() {
        if (this._repaintTimeOut) {
            GLib.Source.remove(this._repaintTimeOut);
            this._repaintTimeOut = null;
        }
        if (this._checkTimeOut) {
            GLib.Source.remove(this._checkTimeOut);
            this._checkTimeOut = null;
        }
        this._indicator?.destroy();
        this._indicator = null;
        this._settings = null;
        this._timerStart?.destroy();
        this._timerStart = null;
        this._timerEnd?.destroy();
        this._timerEnd = null;
    }
}

