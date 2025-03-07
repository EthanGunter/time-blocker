import { App, moment, PluginSettingTab, Setting } from "obsidian";
import TimeBlockPlugin from "../main";
import { DAILY_NOTES, DEFAULT_SETTINGS, getDailyNoteSettings, getPeriodicNoteSettings, PERIODIC_NOTES, pluginExists, type Period } from "./utilities";

const periods: Period[] = [
    'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
]

export class TimeBlockSettingsTab extends PluginSettingTab {
    plugin: TimeBlockPlugin;

    constructor(app: App, plugin: TimeBlockPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // Show integration banner if neither plugin is installed
        if (!pluginExists(PERIODIC_NOTES) && !pluginExists(DAILY_NOTES)) {
            containerEl.createDiv('settings-banner', banner => {
                banner.createEl('h3', { text: 'Recommended Integration' });
                banner.createEl('p', {
                    text: 'For best results, activate either ',
                    cls: 'setting-item-description'
                });
                banner.createEl('a', {
                    text: 'Periodic Notes',
                    href: 'obsidian://show-plugin?id=periodic-notes'
                });
                banner.createEl('span', { text: ' or the built in ' });
                banner.createEl('a', {
                    text: 'Daily Notes',
                    href: 'https://obsidian.md/plugins?id=daily-notes'
                });
                banner.createEl('span', { text: ' plugin.' });
            });
        }

        for (let i = 0; i < periods.length; i++) {
            const period = periods[i];
            this.createPeriodSection(period);
        }
    }

    private createPeriodSection(period: Period) {
        const section = this.containerEl.createDiv('timeblock-period-section');
        const pluginSettings = this.plugin.getSetting(period);

        const managedBy = pluginSettings.plugin

        let format = this.plugin.settings[period].format;

        // Add managed state class to section
        if (managedBy) {
            section.addClass('is-managed');
        }

        // Content area
        if (!this.plugin.settings[period].enabled) {
            const headerSetting = new Setting(section)
                .setName(`${period} Tasks`)
                .setHeading();
            headerSetting.addToggle(toggle => toggle
                .setValue(this.plugin.settings[period].enabled)
                .onChange(async value => {
                    this.plugin.settings[period].enabled = value;
                    await this.plugin.saveSettings();
                    this.display(); // Refresh to show/hide content
                }));
        } else {
            const headerSetting = new Setting(section)
                .setName(`${period} Tasks`)
                .setHeading()
                .addToggle(toggle => toggle
                    .setValue(this.plugin.settings[period].enabled)
                    .onChange(async value => {
                        this.plugin.settings[period].enabled = value;
                        await this.plugin.saveSettings();
                        this.display(); // Refresh to show/hide content
                    }));

            new Setting(section)
                .setName(`Date format`)
                .setDesc(managedBy ? `Managed by ${managedBy}` : `Result: ${moment().format(format)}`)
                .addText(text => text
                    .setValue(format)
                    .setDisabled(!!managedBy)
                    .onChange(async (value) => {
                        this.plugin.settings[period].format = value;
                        await this.plugin.saveSettings();

                        // Update the description text directly instead of refreshing whole UI
                        const descEl = text.inputEl.closest('.setting-item')?.querySelector('.setting-item-description');
                        if (descEl) {
                            descEl.textContent = managedBy
                                ? `Managed by ${managedBy}`
                                : `Result: ${moment().format(value)}`;
                        }
                    })
                )
        }
    }


}
