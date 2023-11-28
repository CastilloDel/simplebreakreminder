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

        // Create a new preferences row
        const row = Adw.SpinRow.new_with_range(0, 1440, 1);
        row.title = 'Time';
        row.subtitle = 'How often to notify you for a break (in minutes)';
        group.add(row);

        // Create a settings object and bind the row to the `time` key
        window._settings = this.getSettings();
        window._settings.bind('time', row, 'value',
            Gio.SettingsBindFlags.DEFAULT);
    }
}

