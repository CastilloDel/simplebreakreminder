import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class ExamplePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // Create a preferences page, with a single group
        const page = new Adw.PreferencesPage({
            title: 'General',
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: 'Behavior',
            description: 'Configure the behavior of the extension',
        });
        page.add(group);

        const row1 = Adw.SpinRow.new_with_range(1, 1440, 1);
        row1.title = 'Time between breaks';
        row1.subtitle = 'How often to notify you for a break (in minutes)';
        group.add(row1);

        const row2 = Adw.SpinRow.new_with_range(1, 1440, 1);
        row2.title = 'Time to add when postponing';
        row2.subtitle = 'How much time to wait after postponing the notification (in minutes)';
        group.add(row2);

        window._settings = this.getSettings();
        window._settings.bind(
            'time-between-breaks', row1, 'value', Gio.SettingsBindFlags.DEFAULT
        );
        window._settings.bind(
            'extra-time', row2, 'value', Gio.SettingsBindFlags.DEFAULT
        );
    }
}

