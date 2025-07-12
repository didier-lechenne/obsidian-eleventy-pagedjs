# Boilerplate for CSS Page Weaver

![Interface](https://gitlab.com/csspageweaver/csspageweaver/-/wikis/uploads/e724d6782600c30bc1b8d1ad56b24217/_screen_copie.webp)

CSS Page Weaver Boilerplate is a HTML document with [CSS Page Weaver](https://gitlab.com/csspageweaver/csspageweaver) and a few [plugins](https://gitlab.com/csspageweaver-toolkit/plugins). This make a lighweight but extandable tool to design publication within browser. CSS Page Weaver Boilerplate is perfect to quickly get familiar with this softwares components without "struggling" with installation. 

## ✨ Features

- **Start small and work you way up**: Boilerplate is great for beginner but give room to advanced users.
- **Streamlined and Ready-to-Use**: Get started quickly with a standardized way to integrate features.
- **Extensive Plugin Library**: No need to reinvent the wheel with the available plugins.
- **WYSIWYG Editor**: Streamline your design pratice with an interface.
- **Create and Share Plugins**: Develop and share your own plugins easily.

## 🚀 Getting Started

### Prerequisites

- A local web server

### 🪴 Installation
 
*If you feel a bit lost with following instruction, you should probably look at the [ready-to-use version of boilerplate as a zip file](https://gitlab.com/csspageweaver-toolkit/boilerplate/-/releases).   
Select lastest, unzip & run a server!*

Clone Boilerplate. Mind to include dependencies with `--recurse-submodules`

```bash
# With SSH
git clone git@gitlab.com:csspageweaver-toolkit/boilerplate.git

# With HTTPS
git clone https://gitlab.com/csspageweaver-toolkit/boilerplate.git
```

## 🔄 Customization

### Add content

Replace default content in `index.html`

### Add CSS stylesheet

Replace default css rules in `css/style.css`.

If you fell confortable, you can add css file path to `csspageweaver/manifest.json` (more [about manifest](designing_with_csspageweaver/using_manifest))

### Add plugins

#### Manually

Check [plugins list](https://gitlab.com/csspageweaver-toolkit/plugins). 

Download one and paste repository folder  into `csspageweaver/plugins`. Mind plugin folder name.

Then, add mentions to them to `csspageweaver/manifest.json`
```json
{
	"plugins": [
		// existing plugins
		"PLUGIN_FOLDER_NAME"
	],
}
```

#### With Command line

Same procedure, but faster


```bash
 git subtree add --prefix="csspageweaver/plugins/{{PLUGIN_NAME}}" git@gitlab.com:csspageweaver/plugins/{{PLUGIN_NAME}}.git --squash
```


Then, add mentions to them to `csspageweaver/manifest.json`

Congratulation! You're now able to get fresh update from plugin repositories with :

```bash
git subtree pull --prefix="csspageweaver/plugins/{{PLUGIN_NAME}}" main --squash 
```

### Add your own JS hook

Replace default content in `js/custom-handler-example-1.js`.

If you fell conforatble, you can add another js file path to `csspageweaver/manifest.json`

## 🎓 Documentation

A complete [documentation is available](https://gitlab.com/csspageweaver/csspageweaver/-/wikis/home)

## 📝 License

This project is licensed under the MIT License

## 👏 Acknowledgements

CSS Page Weaver is based on [PagedJs](https://pagedjs.org/about/) by Coko Foundation. 

CSS Page Weaver is an original idea of Julie Blanc ehanced by Benjamin G.
Julien Taquet was a great help in reimagining the rendering module. Finally, Nicolas Taffin and Julien Bidoret helped to oversee this tool.

All CSS Page Weaver remains linked to their original creators. 
Without them, Page Weaver would remain an empty shell. Thanks 🙏

## 🙌 Contributing 

Documentation requests are welcome! Feel free to check the [issues page](https://gitlab.com/csspageweaver/csspageweaver/-/issues).

Contributions must follow our [code of conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/)