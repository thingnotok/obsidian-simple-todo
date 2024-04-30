import { App, Notice, PluginSettingTab, Setting} from 'obsidian';
import ToggleList from 'src/main';
import {ToggleListSettings, Setup, Command} from 'src/settings';
// import {genDiagramSVG} from 'src/stateDiagram'
import {renderEmptyLine} from 'src/tlAction'

function genSGSection(tab:ToggleListSettingTab){
    const plugin = tab.plugin
    const settings = tab.plugin.settings
    tab.containerEl.createEl('h3', { text: 'Setup The States to Toggle' })
	const setup_list = settings.setup_list
	// Add setup UI for each state group
	settings.setup_list.forEach(setup => {
		addSetupUI(tab, setup);
	})
	// Button: Add a new state group
	new Setting(tab.containerEl).addButton((cb) => {
		cb.setButtonText("+ State Group")
			.setCta()
			.onClick(() => {
				settings.addStateGroup();
				plugin.checkNreload();
			});
	})
	.addButton((cb) => {
		cb.setIcon('checkmark')
		cb.setCta()
		cb.onClick(() => {
			plugin.checkNreload();
		})
	});
}
function addCmdUI(tab:ToggleListSettingTab, cmd:Command, cmdIdx:number){
    const cmd_list = tab.plugin.settings.cmd_list
    const settings = tab.plugin.settings
    const plugin = tab.plugin
	let desc = `${cmd.name}: ${cmd.isPopOver?"popover":""} binding: ${cmd.bindings}`
    const cmd_section = new Setting(tab.containerEl)
			.setName(`${cmd.name}`)
			.setDesc(desc)
			.addToggle((cb) => {
				cb.setValue(cmd.isPopOver)
				cb.onChange((value) => {
					cmd.isPopOver = value;
					plugin.checkNreload();
				})
			})
			.addText((cb) => {
				cb.setValue(cmd.name);
				cb.setPlaceholder("Command Name")
				cb.onChange((value) => {
					cmd.name = value;
				});
			})
			.addText((cb) => {
				cb.setValue(
					cmd.bindings.map(x => x.toString()).join(", ")
				)
				cb.setPlaceholder("Indices of State Groups: 0, 1, 2")
				cb.onChange((value) => {
					cmd.bindings = value.split(",").map(x => parseInt(x, 10));
				})
			})
			.addButton((cb) => {
				cb.setIcon("cross").setTooltip("Delete")
				cb.setCta()
				cb.onClick(() => {
					cmd_list.splice(cmdIdx, 1);
					plugin.checkNreload();
				})
			})
			
}
function genCMDSection(tab:ToggleListSettingTab){
    tab.containerEl.createEl('h3', { text: 'Bind the Commands with State Groups'})
	tab.containerEl.createEl('p', { text: 'Order of bindings matters if two SG share the same states'})
	tab.containerEl.createEl('p', { text: 'Turn on suggestion will show a suggestion window to access all states'})
	tab.containerEl.createEl('p', { text: `[Suggection] [Name] [Binding SG]`})
    const cmd_list = tab.plugin.settings.cmd_list
	for (let i = 0; i < cmd_list.length; i++) {
		addCmdUI(tab, cmd_list[i], i)
	}
	new Setting(tab.containerEl).addButton((cb) => {
		cb.setButtonText('+ Command')
		cb.setCta()
		cb.onClick(() => {
			const name = `Command ${cmd_list.length}`
			if(tab.plugin.settings.setup_list.length>0){
				cmd_list.push(new Command({index:cmd_list.length, name:name, bindings:[0]}));
				tab.plugin.checkNreload();
			}
			else{
				tab.plugin.sendNotify("No State Groups to bind")
			}
		})
	})
	.addButton((cb) => {
		cb.setButtonText("Click to validate")
		cb.setIcon('checkmark')
		cb.setCta()
		cb.onClick(() => {
			tab.plugin.checkNreload();
		})
	})
}
function genMISCSection(tab:ToggleListSettingTab){
    const cmd_list = tab.plugin.settings.cmd_list
    const settings = tab.plugin.settings
    const plugin = tab.plugin
    const other = new Setting(tab.containerEl)
	// Button: goto hotkey setup page for togglelist
	other.addButton((cb) => {
		cb.setButtonText("🔥 Hotkeys")
			.setCta()
			.onClick(() => {
				// console.log("ToggleList: go to hotkey panel")
				this.app.setting.openTabById("hotkeys").setQuery("ToggleList")
			});
	});
	// Button: reset state groups to default groups
	other.addButton((cb) => {
		cb.setButtonText("↻ Reset")
			.setCta()
			.onClick(async () => {
				const stamp = (new Date()).toISOString()
				await this.app.vault.writeConfigJson(`plugins/obsidian-toggle-list/backup-${stamp}`, settings)
				new Notice(`ToggleList: Original config is saved in plugins/obsidian-toggle-list/backup-${stamp}.json`)
				plugin.reset()
				plugin.reloadSettingUI()
			});
	});
}
async function genDiagramSection(tab: ToggleListSettingTab){
	const other = new Setting(tab.containerEl);
	if(tab.plugin.settings.cmd_list.length > 0){
		const svg_container = tab.containerEl.createEl('div');
		// svg_container.innerHTML = await genDiagramSVG(tab.plugin.settings);
	}
	else{
		tab.containerEl.createEl('h2', { text: 
			"Add at least one State Group and one Command to draw State Diagram"})
	}
}
function genExplanation(tab: ToggleListSettingTab): void {
    const exp = tab.containerEl.createEl('div', {cls:'togglelist_div'})
		exp.innerHTML= `<button class="togglelist_btn">
		<a href="https://github.com/thingnotok/obsidian-toggle-list">README</a>
		</button>`
}
function addSetupUI(container: ToggleListSettingTab, setup: Setup): void {
	// console.log('Add new setup ui')
	const plugin = container.plugin
	const sg_ui = new Setting(container.containerEl).addButton((cb) => {
		cb.setIcon("cross").setTooltip("Delete")
		cb.setCta()
			.setCta()
			.onClick(() => {
                plugin.settings.removeSetup(setup)
				plugin.checkNreload()
			});
	});
	const renderedText = renderEmptyLine(setup.all_states)
	sg_ui.setName('State Group: ' + setup.index.toString())
	const ta = sg_ui.addTextArea((text) => {
		text.setValue(renderedText);
		text.onChange(async (text_value) => {
			setup.update(text_value);
		})
		text.inputEl.setAttribute("rows", setup.states.length.toFixed());
		text.inputEl.setAttribute("cols", "25");
		text.inputEl.style.cssText = "resize: none";
	})
}

export class ToggleListSettingTab extends PluginSettingTab {
	plugin: ToggleList;

	constructor(app: App, plugin: ToggleList) {
		super(app, plugin);
		this.plugin = plugin;
	}
    addSettingUI(): void {
        genSGSection(this)
        genCMDSection(this)
        genMISCSection(this)
        genDiagramSection(this)
        genExplanation(this)
    }

	display(): void {
		this.containerEl.empty();
		this.addSettingUI();
	}
}