# Suwayomi-Enhanced-WebUI

Personal fork of [Suwayomi-WebUI](https://github.com/Suwayomi/Suwayomi-WebUI), paired with [Suwayomi-Enhanced](https://github.com/sebastianov92/Suwayomi-Enhanced) server fork.

## Fork additions

- **Settings**
    - Scanlator aliases manager.
    - Send-to-Kindle dedicated page (Gmail-only preset, App Password helper, hidden form when disabled).
    - Local source tools.
    - Notifications page (Telegram).
    - OPDS catalog URL surfaced in Server settings.
    - WebUI flavor selector removed (locked to this fork).
- **Library**
    - Advanced library search screen with combined filters.
    - Recommendations screen (AniList).
    - Card 3-dot button: opacity-based hover, always clickable.
- **Manga page**
    - Metadata override dialog (title/author/genres/custom cover).
    - Per-manga Kindle config dialog (separate toolbar button).
- **Chapter actions**
    - Single + bulk Save CBZ / Save EPUB / Send to Kindle.
    - Bulk Save downloads single ZIP via server endpoint with manga name.
    - Toast warns when non-downloaded chapters skipped.

## Releases

Server expects releases tagged `rXXX` with a `Suwayomi-WebUI-rXXX.zip` asset:

```bash
yarn install
yarn build
yarn build-zip
gh release create rXXX buildZip/Suwayomi-WebUI-rXXX.zip -t "rXXX" -n "Notes"
```

The `versionToServerVersionMapping.json` file at repo root tells the server which WebUI version is compatible with each server version.

---

# Upstream README

This is the repository of the default client of [Suwayomi-Server](https://github.com/Suwayomi/Suwayomi-Server).

The server has this web app bundled by default and is able to automatically update to the latest versions.
Thus, there is no need to manually download any builds unless you want to host the app yourself instead of having it hosted by the Suwayomi-Server.

## Features

- Library management
    - Library page - manga management
        - Filter/Sort/Search your manga
        - Use categories to categorize your manga
        - Select manga in your library and perform actions (e.g. download, change categories, mark as read, ...) on one or multiple manga
    - Manga page - chapter management
        - Filter/Sort the chapter list
        - Select chapters and perform actions (e.g. download, bookmark, mark as read, ...) on one or multiple manga
    - Select a range of manga/chapters by using shift + left click or long press
    - Overview of duplicated manga in your library (settings > library)
- Reader
    - Desktop and Mobile UI
    - Default settings per reading mode
    - Settings per manga
    - Reading modes (Single/Double Page, Continuous Vertical/Horizontal, Webtoon)
    - Page scale modes (limit by width/height/screen, scale small pages, custom reader width)
    - Image filters
    - Customizable keybinds
    - Auto scrolling
    - Infinite chapter scrolling
    - Option to ignore duplicated chapters while reading
    - Option to automatically download next chapters while reading
    - Option to automatically delete downloaded chapters after reading them
    - ...
- Download queue
- Reading history (**rudimentary**)
- Settings per device (e.g. different reader settings for pc, phone and tablet)
- Sources
    - Migration of manga between sources
    - Hide in library manga while browsing sources
    - Save source searches to easily reuse them
    - Duplication check when adding a new manga to your library
    - Quick add/remove a manga to your library in the source browse (hover with mouse on pc or long press on touch devices)
- App updates
    - Inform about available WebUI and Server updates
    - Inform about successful WebUI and Server updates since the last time the app was used
- Themes
    - Use predefined themes
    - Create your own themes
    - Dynamic theme on manga pages

## Preview

An ongoing changelog of all relevant changes since the last stable release can be found [here](https://github.com/Suwayomi/Suwayomi-WebUI/blob/master/CHANGELOG.md)

To use the preview version you can select the PREVIEW channel in the settings of your Suwayomi-Server.
The server is then able to download and also keep the version automatically up-to-date.

Keep in mind that the preview version might need a newer version than the stable server.
In case your server is outdated, it will automatically downgrade to the latest compatible WebUI version.

Minified builds of WebUI can be found here [Suwayomi-WebUI-preview](https://github.com/Suwayomi/Suwayomi-WebUI-preview).

Additionally, there is an online build of the WebUI preview version that is available [here](https://suwayomi-webui-preview.github.io/).
_Make sure to set your Suwayomi-Server hostname in Settings or you'll get infinite loading._ Also note that its the **latest** revision of WebUI and might not work correctly if you connect to a stable build of Suwayomi-Server.

## Contributing and Technical info

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Translation

Feel free to translate the project on [Weblate](https://hosted.weblate.org/projects/suwayomi/suwayomi-webui/)

<details><summary>Translation Progress</summary>
<a href="https://hosted.weblate.org/engage/suwayomi-webui/">
<img src="https://hosted.weblate.org/widgets/suwayomi/-/suwayomi-webui/multi-auto.svg" alt="Translation status" />
</a>
</details>

## License

    Copyright (C) Contributors to the Suwayomi project

    This Source Code Form is subject to the terms of the Mozilla Public
    License, v. 2.0. If a copy of the MPL was not distributed with this
    file, You can obtain one at http://mozilla.org/MPL/2.0/.
