# #ASKtraining Configurator
[new #ASKnet 2021 edition]

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
docker-compose up -d
```
and then go to your browser and type `http://0.0.0.0:4000/Training`

To stop the training plan:
```
docker-compose stop
```
Then you can use the following command to start the training planner at any time without needing an internet connection:
```
docker-compose start
```
## Partners and Funder

| r0g Agency | ASKnet | developed by nanoLogika | BMZ |
| :--------: | :----: | :-------------------------: | :-------: |
|[![r0g Logo](assets/img/r0g_logo.png)](https://openculture.agency/)|[![#ASKnet Logo](assets/img/asknet-logo.png)](https://github.com/ASKnet-Open-Training)| [![nanoLogika Logo](assets/img/partner-nanologika-logo.png)](https://www.nanologika.de) | [![BMZ Logo](assets/img/founder_BMZ.jpg)](https://www.bmz.de/en/) |
| [Official Website](https://openculture.agency/) | [Official Website](https://github.com/ASKnet-Open-Training) | [Official Website](https://www.nanologika.de) | [Official Website](https://www.bmz.de/en/) |

## License

<a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/4.0/88x31.png" /></a><br />All content is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/">Creative Commons Attribution-ShareAlike 4.0 International License</a>.

The Configurator Software is licensed under a GPLv3 License (see LICENSE.md File)
