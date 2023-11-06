# #ASKtraining training plan

With the #ASKnet training plan you can compile and plan your individual training. You can choose from the different training modules and freely organize the schedule for your training. The training plan automatically creates a schedule with recommended breaks, which are then individually adjusted.

![Trainingsplan Overview](assets/img/screenshot.png)

Afterwards, the training plan shows which resources are needed, how high the material costs are, how high the recommended number of participants should be and how many trainers are needed.

You can also add helpful attachments to your training plan, such as a timetable, material checklists, and more. Your individual training plan is ready, which you can then download as a PDF package to share or print out.

## --===<({   [Demo](https://asktraining.github.io/Training/)   })>===--

## Documentation

All information on how to use the training plan, install it or create additional modules can be found in the [documentation](https://asktraining.github.io/docs/).

## Developer

Here you can see the [concept paper](https://md.bmen.cc/training-generator)

### Run local

To run the training plan locally, the following are required:

- docker >~ v.20.10.3
- docker-compose >~ v.1.27.4
- and an internet connection for the first run

If the requirements are met, all you need to do is check out this Git repository locally and enter the following command in the repository's directory:

```
docker compose up -d
```
and then go to your browser and type `http://0.0.0.0:4000`

Note: In case the browser can't open the link above open the "Gemfile" in the "Training" repository and add: 
```
gem "webrick" 
```
to the end of the file, save the file, stop docker compose and start docker compose again with 
```
docker compose up 
```
again. This is only a temporary adjustment for local instance development! DO NOT COMMIT TO MAIN BRANCH!

To stop the training plan:
```
docker compose stop
```
Then you can use the following command to start the training planner at any time without needing an internet connection:
```
docker compose start
```
### Styling (CSS, SASS, etc.)

Basically, all styling changes are made in the **Sass files** in the `/_sass` folder. The min.css and min.css.map files (target) will be compiled automaticly from the Sass files (source). You can find more information about the Sass syntax here: https://sass-lang.com/documentation/syntax/

#### Compiling CSS from Sass

**Important:** You need a Sass compiler for this! If you use VSCodium as your IDE, you can use the plugin [Live Sass Compiler
](https://github.com/glenn2223/vscode-live-sass-compiler).

The following settings in the plugin are recommended:

```
"liveSassCompile.settings.formats": [
    {
        "format": "compressed",
        "extensionName": ".min.css",
        "savePath": "assets/css/",
        "savePathReplacementPairs": null
    }
],
```
How to change the settings for the `Live Sass Compiler` plugin and how to use it you can find it here: https://github.com/glenn2223/vscode-live-sass-compiler/blob/master/docs/settings.md

#### Ohter CSS-Libraries

CSS libraries from other sources are saved directly in the `/assets/css` folder as `*.min.css` and `*.min.css.map`. To do this, please enter the version number of the library in the file name in the following format.

Example: `bootstrap-5.3.2.min.css`

The library must then be integrated either in a layout file in the `/_layouts` directory or in `main.sass` in the `/_sass` directory.


## Partners and Funder

| r0g Agency | ASKnet  | BMZ |
| :--------: | :----: | :-------: |
|[![r0g Logo](assets/img/r0g_logo.png)](https://openculture.agency/)|[![#ASKnet Logo](assets/img/asknet-logo.png)](https://github.com/ASKnet-Open-Training)|  [![BMZ Logo](assets/img/founder_BMZ.jpg)](https://www.bmz.de/en/) |
| [Official Website](https://openculture.agency/) | [Official Website](https://github.com/ASKnet-Open-Training) | [Official Website](https://www.bmz.de/en/) |

## License

<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a><br />All content is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.

The Configurator Software is licensed under a GPLv3 License (see LICENSE.md File)

first prototype developed by [NanoLogika](https://www.nanologika.de) 

[![nanoLogika Logo](assets/img/partner-nanologika-logo.png)](https://www.nanologika.de) 
