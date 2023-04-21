# abl2tikz

Command line tool for converting Keysight ADS schematics to CircuiTikZ

## Prerequisites

This is a Node.js package and thus an installation of node and npm (usually bundled with node) is necessary. Node.js
version 18 (LTS) was used for development. It is not necessary to match this version, but it is recommended not to use
outdated releases.

NPM is on some systems by default configured to install global packages to a folder only admins can access. This can be
resolved either by using admin rights on every (global) package installation or by changing NPMs prefix. Global
installation of this package is not necessary, but it makes using it easier, as it can be run form within any
directory.

You can check your current prefix with

```shell
npm config get prefix -g
```

and alter it with

```shell
npm config set prefix <MY-GLOBAL-PREFIX> -g
```

NPMs documentation suggests `%APPDATA%\npm` or `%LOCALAPPDATA%\npm` for Windows and `~/.npm-global` for Linux/macOS. In
order to run globally installed programs, the `PATH` variable should contain `<MY-GLOBAL-PREFIX>/bin`. As this depends
on your system and the Node.js (installer) version, it is recommended to check the documentation and your configuration
before applying any changes.

NPM provides information about this topic on several sites:

-   <a href="https://docs.npmjs.com/downloading-and-installing-packages-globally">Downloading and installing packages globally</a>
-   <a href="https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally">Resolving EACCES permissions errors when installing packages globally</a>,
-   <a href="https://docs.npmjs.com/try-the-latest-stable-version-of-npm">Try the latest stable version of npm</a>

## Installation

Abl2tikz is not (yet) uploaded to a public repository like npmjs.com. In order to use it you must either download the
newest release as an archive (abl2tikz-\*.tgz) or pull it from GitLab.

There are three options for installing:

-   install globally
-   link
-   install

Plain install just fetches dependencies. It can then only be executed from within the package directory. Link(ing) works
similar, but also creates a link in the global prefix to this package. It can therefore be executed in any directory, as
long as the package directory isn't moved or deleted. The global install instead copies the package to the global prefix
and then fetches dependencies. The package (folder) can therefore be removed while the program still works within any
directory.

### Install from tarball

For a global install, run the following command in a shell/command prompt. If you don't want to install globally, just
omit the `-g`.

```shell
npm install -g path/to/abl2tikz-x.x.x.tgz # replace with your path
```

If you install locally, the program is now in `node_modules/abl2tikz/`. You can now (optionally) link it. To do so, you
must first change to this directory and then run `npm link`:

```shell
cd node_modules/abl2tikz/
npm link
```

### Install from git or directory

Clone/pull the current version from git or download from GitLab and extract the files. Open a shell or command prompt
and navigate to the extracted folder. If you list the folder contents, you should see this readme file.

Then decide if you want to install locally:

```shell
npm install
```

install globally:

```shell
npm install -g
```

or install (locally) and link globally:

```shell
npm link
```

## Usage

If installed globally (or linked), the CLI can be run using
```shell
abl2tikz <arguments ...>
```
Otherwise, the path to the file `cli.mjs` must be typed every time
```shell
node path/to/abl2tikz/cli.mjs <arguments ...>
```

There are three supported commands:
- convert
- list-cells
- list-schematics
Abl2tikz and every command have a built-in help. E.g. to show the help for convert, just type

```shell
abl2tikz convert --help
```

### Usage example
Let's say you have exported the file `myProject.xml` from Keysight ADS using Advanced Board Link. You can now list all
cells and schematics using

```shell
abl2tikz list-schematics myProject.xml
```
creating the output
```
Schematics of main:
 - my schematic
Schematics of connections:
 - test schematic
 - schematic
```

You could now convert the schematic `my schematic` from the cell `main` to the file `innovativeSchematic.pgf`:
```shell
abl2tikz convert --cellname main --schematicname "my schematic" myProject.xml innovativeSchematic.pgf
```