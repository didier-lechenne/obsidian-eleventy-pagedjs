# CSS Page Weaver 

![Interface](https://gitlab.com/csspageweaver/csspageweaver/-/wikis/uploads/e724d6782600c30bc1b8d1ad56b24217/_screen_copie.webp)

CSS Page Weaver is a browser-based publishing tool, made up of [PagedJs](https://pagedjs.org/about/) library and modulars additionals features. While it's design to ease installation for beginners CSS Page Weaver also bring elegant and extendable solution for more advanced users.

## ✨ Features

- **Streamlined and Ready-to-Use**: Get started quickly with a standardized way to integrate features.
- **Extensive Plugin Library**: No need to reinvent the wheel with the available plugins.
- **WYSIWYG Editor**: Streamline your design pratice with an extandable interface.
- **Create and Share Plugins**: Develop and share your own plugins easily.

## ⛵ Getting Started

### Prerequisites

- A local web server

### 🪴 Installation (fastest way)

If you feel a bit lost with following instruction, you should probably look at the [CSS Page Weaver compiled with a few plugins](https://gitlab.com/csspageweaver/csspageweaver/-/releases)

Integrate it at the root level of your page and add a link to `csspageweaver` main _module_ into your HTML template

```html
<script src="/csspageweaver/main.js" type="module"></script>
```

*Do you need to also install PagedJs? Nope! CSS Page Weaver already embed it.*

### Use

Run a simple server. That's it!

### Boilerplate 

Don't have a project to test it? There is [a ready-to-use boilerplate](https://gitlab.com/csspageweaver//boilerplate). Download, unzip & run a server!


## 🚀 Going further

### 🌲 Installation (complete way)

Released version on CSS Page Weaver is compiled with few plugins. You can install the package yourself for greater control.

#### Clone CSS Page Weaver repo in your project [option A].

```bash
# With HTTPS
git clone https://gitlab.com/csspageweaver/csspageweaver.git

# With SSH
git clone git@gitlab.com:csspageweaver/csspageweaver.git
```
#### Clone CSS Page Weaver as a git subtree [option B].

Subtree are great to:
- embed CSS Page Weaver repo in another repo
- get updates 

```bash
 git subtree add --prefix csspageweaver/ git@gitlab.com:csspageweaver/cssPageWeaver.git --squash
```

### 🔌 Dependencies

CSS Page Weaver is designed to work with plugins. In this complete installation, you need to install plugins by yourself. If you've downloaded [the last release of CSS Page Weaver](https://gitlab.com/csspageweaver/csspageweaver/-/releases), few plugins are already embedded.

**Here is a [list of all plugins](https://gitlab.com/csspageweaver//plugins) known.**

**Steps**

1. Download and place plugin folder in `csspageweaver/plugins`
2. Add plugin to manifest

#### Installation as subtree

We prefer to install plugins using Git Subtree because it allows us to easily preserve the filiation link with the plugin directory (and to obtain updates!).

Bear in mind, if you're not comfortable with command lines, that *step 1* can easily be replaced by a simple *download, drag and drop*.

Otherwise, here is how it works.

##### (Step 1) Clone plugin as a subtree

Install plugin as a submodule of `csspageweaver`

```bash
 git subtree add --prefix="csspageweaver/plugins/{{PLUGIN_FOLDER_NAME}}" git@gitlab.com:csspageweaver/plugins/{{PLUGIN_NAME}}.git --squash
```

##### (Step 2) Add plugin to manifest

Almost done. Add a mention to `csspageweaver/manifest.json`

```json
{
	"plugins": [
		// existing plugin,
		"PLUGIN_FOLDER_NAME"
	],
}
```

Look at complete [plugins list](https://gitlab.com/csspageweaver/plugins) and [plugins installation guide](https://gitlab.com/csspageweaver/csspageweaver/-/wikis/design/plugins/install)

#### Update as subtree

This is where Git subtrees are wonderful

```bash
git subtree pull --prefix="csspageweaver/plugins/{{PLUGIN_NAME}}" main --squash 
```

A bit dazed? Don't worry. Once again, you can update your plugins with your favorite *download, unzip, drag and drop* shady method.

### 🎁 Package manager

You already like the principle of subtrees, but you think (rightly) that the multiplication of command lines can be a bit tedious in the long run? Installation and dependencies can me handle with our [Package Manager](https://gitlab.com/csspageweaver/package-manager)

**Install CSS Page Weaver and plugins with package manager**

```bash
./weaver_manager.sh --install 
```

**Get update with package manager**

```bash
./weaver_manager.sh --pull 
```

See [Package Manager repository](https://gitlab.com/csspageweaver/package-manager) and [further documentation on managing your installation](https://gitlab.com/csspageweaver/csspageweaver/-/wikis/maintain_and_develop/core/5-manage_csspageweaver_integration)


## 🔄 Customization

### Basic Information

Edit `csspageweaver/manifest.json` to declare:
- Plugins
- Plugins configuration
- Stylesheets
- Your custom hooks

### CSS Page Weaver behavior (advanced)

Edit `csspageweaver/main.js` to:
- disable Common dictionary
- disable Interface
- Choose render method

## 🎓 Documentation

A complete [documentation is available](https://gitlab.com/csspageweaver/csspageweaver/-/wikis/home)

## 📝 License

This project is licensed under the MIT License

## 👏 Acknowledgements

CSS Page Weaver is based on [PagedJs](https://pagedjs.org/about/) by Coko Foundation. 

CSS Page Weaver is an original idea of Julie Blanc ehanced by Benjamin G.
Julien Taquet was a great help in reimagining the rendering module. Finally, Nicolas Taffin and Julien Bidoret helped to oversee this tool.

All CSS Page Weaver plugins remains linked to their original creators. 
Without them, GUI would remain an empty shell. Thanks 🙏

## 🙌 Contributing 

Features and documentation requests are welcome! Feel free to check the [issues page](https://gitlab.com/csspageweaver/csspageweaver/-/issues).

Contributions must follow our [code of conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)