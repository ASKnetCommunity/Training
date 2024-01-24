const ID_MODULE_LIST_SIDE_BAR = 'module-list-side-bar';
const ID_MODULE_LIST_TRAINING = 'module-list-training';
const CLASS_DAYBREAK = 'daybreak';
const CLASS_TIMEBREAK = 'timebreak';
const CLASS_MODULE = 'module';
const CLASS_RESOURCE = 'resource';
const CLASS_TRAININGSTART = 'trainingstart';
const CLASS_SUBMITTIME = 'submit';
const CLASS_CLOSETIME = 'close'
const CLASS_EDITTIME = 'edit-time';
const CLASS_MODULEDURATION = 'module-duration';
const CLASS_MULTIDRAGSELECTED = 'multidrag-selected';
const CLASS_INTRODUCTION = 'introduction'
const GROUP_MODULELIST = 'module-list-group';
const TRAINING_URL = 'trainingUrl';
const TRAINING_DATA = 'training-data';
const SUMMARY_DATA = 'summary-data';
const ID_SUMMARY_EL = 'summary-text-2';
const ID_TRAINING_TITLE = 'training-title';
const ID_TRAINING_DESCRIPTION = 'training-description';

/**
 * Drag & Drop
 */
const ANIMATION_SPEED = 85;

function initiateSortable() {
    let moduleListTraining = document.getElementById(ID_MODULE_LIST_TRAINING);
    Sortable.create(moduleListTraining, {
        filter: '.trainingstart',
        group: {
            name: GROUP_MODULELIST,
            put: true
        },
        fallbackOnBody: true,
        swapThreshold: 0.2,
        animation: ANIMATION_SPEED,
        multiDrag: true,
        avoidImplicitDeselect: true,
        onAdd: runDynamicCalculationsOnAdd,
        onUpdate: runDynamicCalculationsOnUpdate,
    });

    let moduleListSideBar = document.getElementById(ID_MODULE_LIST_SIDE_BAR);
    Sortable.create(moduleListSideBar, {
        group: GROUP_MODULELIST,
        animation: ANIMATION_SPEED,
        multiDrag: true,
        avoidImplicitDeselect: true,
        fallbackTolerance: 3,
        selectedClass: CLASS_MULTIDRAGSELECTED,
        onSelect: onModuleSelect,
        onDeselect: onModuleDeselect,
        onEnd: onModuleDrag,
    });

    let breakListSideBar = document.getElementById('break-list-side-bar');
    Sortable.create(breakListSideBar, {
        group: {
            name: GROUP_MODULELIST,
            pull: 'clone'
        },
        sort: false,
        onEnd: updateClonedBreaks // we need this because cloning does not copy event listeners added using addEventListener() or those assigned to element properties (e.g., node.onclick = someFunction) (https://developer.mozilla.org/en-US/docs/Web/API/Node/cloneNode)
    });

    let index = 0;
    let resourceListLists = document.getElementsByClassName('resource-list');
    for (ul of resourceListLists) {
        Sortable.create(ul, {
            group: {
                name: `resource-list-${index}`,
                put: function () {
                    const chosenClassName = document.getElementsByClassName('sortable-chosen')[0].className;
                    const isResource = chosenClassName.includes(CLASS_RESOURCE);
                    const isTimeBreak = chosenClassName.includes(CLASS_TIMEBREAK);
                    const isDayBreak = chosenClassName.includes(CLASS_DAYBREAK);
                    return isResource || isTimeBreak || isDayBreak;
                },
                pull: function () {
                    const chosenClassName = document.getElementsByClassName('sortable-chosen')[0].className;
                    const isTimeBreak = chosenClassName.includes(CLASS_TIMEBREAK);
                    const isDayBreak = chosenClassName.includes(CLASS_DAYBREAK);
                    return isTimeBreak || isDayBreak;
                }
            },
            fallbackOnBody: true,
            animation: ANIMATION_SPEED,
            onAdd: onResourcesUpdate,
            onUpdate: onResourcesUpdate
        });
        index++;
    }
}

/**
 * Performs actions when a module is selected
 * @param {Event} evt Selection event
 */
function onModuleSelect(evt){
    let module = evt.item;
    let checkBox = module.querySelector('.select-check');
    checkBox.innerHTML = '<i class="far fa-check-circle"></i>';
    checkBox.dataset.tooltip = 'deselect module';
}

/**
 * Performs actions when a module is deselected
 * @param {Event} evt Selection event
 */
function onModuleDeselect(evt){
    let module = evt.item;
    let checkBox = module.querySelector('.select-check');
    checkBox.innerHTML = '<i class="far fa-circle"></i>';
    checkBox.dataset.tooltip = 'select module';
}

/**
 * Performs actions after a module is dragged
 * @param {Event} evt Dragging event
 */
function onModuleDrag(evt){
    for (let i in evt.items) {
        Sortable.utils.deselect(evt.items[i]); // this is the ideal solution but doesn't work for now
        evt.items[i].className = evt.items[i].className.split(' ').filter(clazz => clazz != CLASS_MULTIDRAGSELECTED).join(' ');
    }
}

/**
 * Performs actions after update to resources list
 * @param {Event} evt Dragging event
 */
function onResourcesUpdate(evt) {
    calculateTime();
    clearPageBreaks();
    backupTrainingPlan();
}

/**
 * Clones and activates a timebreak
 * @param {Number} duration duration of the break
 * @param {String} title Title of the break e.g. lunch, recess
 * @returns {Node} Timebreak Node
 */
function cloneTimeBreak(duration, title){
    let MODULE_TIME_BREAK = document.getElementsByClassName(CLASS_TIMEBREAK)[0].cloneNode(true);
    MODULE_TIME_BREAK.dataset.duration = duration ? Number(duration) : 15;
    if (title) {
        let titleEl = MODULE_TIME_BREAK.querySelector('.break-title');
        titleEl.innerText = title;
    }
    activateTimeBreak(MODULE_TIME_BREAK);
    let form = MODULE_TIME_BREAK.querySelector('form');
    clickButtonOnEnter(form, `.duration`, `.${CLASS_SUBMITTIME}`);
    return MODULE_TIME_BREAK;
}

/**
 * Clones and activates a daybreak
 * @param {String} start starting time of the day
 * @param {Number} duration duration of the day's introduction
 * @returns {Node} daybreak Node
 */
function cloneDayBreak(start, duration){
    let MODULE_DAY_BREAK = document.getElementsByClassName(CLASS_DAYBREAK)[0].cloneNode(true);
    MODULE_DAY_BREAK.dataset.start = start ?? '09:00';
    MODULE_DAY_BREAK.dataset.duration = duration ? Number(duration) : 15;
    activateTimeBreak(MODULE_DAY_BREAK);
    return MODULE_DAY_BREAK;
}


/**
 * Button onclick initialisations
 */
function initiateEditTitle(){
    let editButton = document.getElementById('edit-icon');
    editButton.onclick = showEditTitle;
    let closeButton = document.querySelector('#edit-title-and-description .close-popup')
    closeButton.onclick = showEditTitle;
    let submitButton = document.getElementById('submit-title');
    submitButton.onclick = submitTitle;
    let form = document.querySelector('#edit-title-and-description form');
    clickButtonOnEnter(form, '.title', '#submit-title');
}

function showEditTitle(){
    let editTitle = document.getElementById('edit-title-and-description');
    if(editTitle.style.transform == 'scale(0, 0)' || editTitle.style.transform == '' || editTitle.style.transform == 'scale(0)'){
        editTitle.style.transform = 'scale(1, 1)';
        return;
    }
    editTitle.style.transform = 'scale(0, 0)';
}

function submitTitle(){
    let editTitle = document.getElementById('edit-title-and-description');
    editTitle.style.transform = 'scale(0,0)';

    let form = this.parentNode;
    let title = document.getElementById(ID_TRAINING_TITLE);
    let newTitle = getChildByClassName(form, 'title').value;
    if(newTitle != '') title.innerText = newTitle;

    let description = document.getElementById('training-description');    
    let newDescription = getChildByClassName(form, 'description').value;
    if(newDescription != '') description.innerText = newDescription;
    backupTrainingPlan();
}

/**
 * Initiate the buttons for editing summary
 */
function initiateEditSummary(){
    let editButton = document.getElementById('edit-summary-button');
    editButton.onclick = showEditSummary;
    let submitButton = document.getElementById('submit-summary');
    submitButton.onclick = submitSummary;
    let closeButton = document.getElementById('close-summary');
    closeButton.onclick = showEditSummary;
    let resetButton = document.getElementById('reset-summary');
    resetButton.onclick = clearSummary;
}

/**
 * Open and close the summary edit dialog
 */
function showEditSummary(){
    let editSummary = document.getElementById('edit-summary');
    if(editSummary.style.transform == 'scale(0, 0)' || editSummary.style.transform == ''){
        editSummary.style.transform = 'scale(1,1)';
        return;
    }
    editSummary.style.transform = 'scale(0,0)';
}

/**
 * Submit changes after updating summary
 */
function submitSummary(){
    let editSummary = document.getElementById('edit-summary');
    editSummary.style.transform = 'scale(0,0)';

    let form = this.parentNode.parentNode;
    let summaryEl = document.querySelectorAll('.summary-text');   
    let editButton = document.getElementById('edit-summary-button'); 
    let newSummary = form.querySelector('#summary-text-input').value;
    if(newSummary != '') {
        summaryEl.forEach((el) => el.innerHTML = `<p>${newSummary}</p>`);
        editButton.innerText = 'Edit summary notes';
    } else {
        summaryEl.forEach((el) => el.innerHTML = ``);
        editButton.innerText = 'Add summary notes';
    }
    backupTrainingPlan();
}

/**
 * Clears the input textfield for the summary. It does not save the changes.
 */
function clearSummary(){
    let form = this.parentNode.parentNode;
    let inputEl = form.querySelector('#summary-text-input');
    inputEl.value = "";
}

function initiateEditResourceQuantity(){
    let inputQuantity = document.getElementsByClassName('quantity-input');
    for(let input of inputQuantity){
        input.onchange = editResourceQuantity;
    }
}

function editResourceQuantity(){
    let parentNode = this.parentNode.parentNode;
    let valueEl = getChildByClassName(parentNode, 'material-costs'); 
    let cost = parseInt(valueEl.dataset.cost);
    let oldValue = parseInt(valueEl.innerText);
    let newValue = cost * parseInt(this.value);
    valueEl.innerText = newValue + ' $';
    let totalSumEl = document.getElementById('total-price');
    let totalSum = parseInt(totalSumEl.innerText);
    let newSum = totalSum - oldValue + newValue;
    totalSumEl.innerText = newSum + ' $';
}

function initiateTrashButton() {
    let trashButtons = document.getElementsByClassName('trash');
    for (btn of trashButtons) {
        btn.onclick = onClickDeleteOrMoveListElement
    }
}

function onClickDeleteOrMoveListElement() {
    let currentElement = this;
    while (currentElement.tagName !== 'LI') {
        currentElement = currentElement.parentNode;
    }
    if (currentElement.className.includes(CLASS_MODULE)) {
        deleteIntroductionDuration(currentElement);
        let moduleListSideBar = document.getElementById(ID_MODULE_LIST_SIDE_BAR);
        moduleListSideBar.appendChild(currentElement);
        updateUrl(currentElement.id);
        calculateTime();
        // insertDayBreaks();
        clearPageBreaks();
        calculateSummary();
        updateTableOfContents();
        updateAuthorList();
        backupTrainingPlan();
        return;
    }
    currentElement.remove();
    calculateTime();
    // insertDayBreaks();
    calculateSummary();
    updateTableOfContents();
    backupTrainingPlan();
}

function initiateTimeEdit(){
    let classesWithTimeButton = [CLASS_MODULE, CLASS_TRAININGSTART, CLASS_TIMEBREAK, CLASS_DAYBREAK]
    initiateTimeButton(classesWithTimeButton);
    initiateSubmitTimeButton();
    initiateCloseButton();
}

function initiateTimeButton(classes){
    for(clazz of classes){
        let trainingstartClock = document.querySelectorAll(`.${clazz} .fa-edit`);
        for(let clock of trainingstartClock){
            clock.onclick = toggleTimeEditWindow;
        }
    }
}

function toggleTimeEditWindow(){
    let timeEdit = this.parentNode.parentNode.querySelector(`.${CLASS_EDITTIME}`);
    if(timeEdit == null){
        return;
    }
    if(timeEdit.style.display == 'block'){
        timeEdit.style.display = '';
    } else {
        let allTimeEditors = document.querySelectorAll(`.${CLASS_EDITTIME}`);
        for(let editor of allTimeEditors){
            editor.style.display = '';
        }
        timeEdit.style.display = 'block';
    }
}

function initiateSubmitTimeButton(){
    let submitTimeButtons = document.querySelectorAll(`.${CLASS_SUBMITTIME}`);
    for(let button of submitTimeButtons){
        button.onclick = submitTime;
        let form = button.parentNode;
        clickButtonOnEnter(form, `.duration`, `.${CLASS_SUBMITTIME}`);
    }
}

function getStartTime(hoursEl, minutesEl, amOrPm){
    let start = '9:00'
    if(hoursEl != null && minutesEl != null){
        if(hoursEl.value === '') hoursEl.value ='9';
        if(minutesEl.value === '') minutesEl.value = '0';
        if(amOrPm.value === 'am'){
            start = `${hoursEl.value}:${minutesEl.value}`;
        } else if(amOrPm.value === 'pm'){
            let hours = parseInt(hoursEl.value) + 12;
            hours = hours === 24 ? 0 : hours;
            start = `${hours}:${minutesEl.value}`;
        }
    }
    return start;
}

function submitTime(){
    const form = this.parentNode;

    const hoursEl = getChildByClassName(form, 'hours');
    const minutesEl = getChildByClassName(form, 'minutes');
    const amOrPm = getChildByClassName(form, 'am-or-pm');
    let start = getStartTime(hoursEl, minutesEl, amOrPm);
    
    let duration = getChildByClassName(form, 'duration').value;
    if(duration === ''){
        duration = '15';
    }

    const titleEl = getChildByClassName(form, 'title');
    
    let currentElement = this;
    let runLoop = true;
    while(runLoop){
        let currClassName = currentElement.className;
        if(currClassName.includes(CLASS_MODULE) 
        || currClassName.includes(CLASS_TRAININGSTART) 
        || currClassName.includes(CLASS_DAYBREAK)
        || currClassName.includes(CLASS_TIMEBREAK)
        || currClassName.includes(CLASS_RESOURCE)){
            currentElement.dataset.duration = duration;
            if (currentElement.className.includes('resource')) {
                let displayEl = currentElement.querySelector('.duration-display');
                if (parseInt(duration) > 0) {
                    let hours = Math.floor(parseInt(duration)/60), displayText = '';
                    let minutes = parseInt(duration)%60;
                    if (hours > 0) {
                        displayText = `${hours} h `;
                    }
                    if (minutes > 0) {
                        displayText += `${minutes} min`;
                    }
                    displayEl.innerHTML = `<i class="fas fa-hourglass-half"></i> ${displayText}`;
                } else {
                    displayEl.innerHTML = '0 h';
                }
            }
            if(currClassName.includes(CLASS_TRAININGSTART)
            || currClassName.includes(CLASS_DAYBREAK)){
                currentElement.dataset.start = start;
            }
            if((titleEl != null && titleEl.value != '') 
            && (currClassName.includes(CLASS_TRAININGSTART)
            || currClassName.includes(CLASS_DAYBREAK)
            || currClassName.includes(CLASS_TIMEBREAK))){
                let titleNode = getChildByClassName(currentElement, 'break-title');
                titleNode.innerText = titleEl.value;
            }
            runLoop = false;
        }
        currentElement = currentElement.parentNode;
    }
    
    form.parentNode.style.display = '';
    calculateTime()
    backupTrainingPlan();
}

function initiateCloseButton(){
    let closeTimeButtons = document.querySelectorAll(`.${CLASS_CLOSETIME}`);
    for(let button of closeTimeButtons){
        button.onclick = closeTime;
    }
}

function closeTime(){
    this.parentNode.parentNode.style.display = '';
}

/**
 * Updates a time or day break after it has been cloned
 * @param {Event} evt The dragging event
 */
function updateClonedBreaks(evt){
    let timebreak = evt.item;
    activateTimeBreak(timebreak);
}

/**
 * Activates the event listeners on a cloned timebreak/daybreak
 * @param {Element} timebreak Timebreak element
 */
function activateTimeBreak(timebreak){
    let iconButton = timebreak.querySelector('.fa-edit');
    iconButton.onclick = toggleTimeEditWindow;
    let submitButton = timebreak.querySelector('.submit');
    submitButton.onclick = submitTime;
    let closeButton = timebreak.querySelector('.close');
    closeButton.onclick = closeTime;
    let trashButton = timebreak.querySelector('.trash');
    trashButton.onclick = onClickDeleteOrMoveListElement;
}

/**
 * Mobile button initialisations
 */

function initiateMobileButtons(){
    initiateShowSidebar();
    initiateAddModule();
    initiateCloseSidebar();
    initiateAddTimebreak();
    initiateAddDaybreak();
}

function initiateShowSidebar(){
    let addModule = document.getElementById('add-module-mobile');
    addModule.onclick = showSidebar;
}

function showSidebar(){
    let el = document.getElementById('MultipleContainers');
    if(!el.className.includes('open-sidebar')){
        el.className = el.className.concat('open-sidebar');

        const sideBarModules = document.getElementById(ID_MODULE_LIST_SIDE_BAR).getElementsByClassName(CLASS_MODULE);
        for(let mod of sideBarModules){
            mod.draggable = false;
        }
    }
}

function initiateAddModule(){
    let addButtons = document.querySelectorAll(`.${CLASS_MODULE} .add-module`);
    for(let btn of addButtons){
        btn.onclick = addModule;
    }
}

function addModule(){
    let currEl = this.parentNode; // start with parentNode because this className already includes "module" => don't use the component names in class names
    while(!currEl.className.includes(CLASS_MODULE)){
        currEl = currEl.parentNode;
    }
    let moduleList = document.getElementById(ID_MODULE_LIST_TRAINING);
    moduleList.appendChild(currEl);
    calculateTime();
    calculateSummary();
    closeSidebar();
}

function initiateCloseSidebar(){
    let closeSidebarButton = document.getElementById('close-sidebar-mobile');
    closeSidebarButton.onclick = closeSidebar;
}

function closeSidebar(){
    let el = document.getElementById('MultipleContainers');
    if(el.className.includes('open-sidebar')){
        const elClasses = el.className.split(' ');
        const elClassesWithoutSidebar = elClasses.filter(className => className != 'open-sidebar');
        el.className = elClassesWithoutSidebar.join(' ');

        const sideBarModules = document.getElementById(ID_MODULE_LIST_SIDE_BAR).getElementsByClassName(CLASS_MODULE);
        for(let mod of sideBarModules){
            mod.draggable = true;
        }
    }
}

function initiateAddTimebreak(){
    let addTimebreakButton = document.getElementById('add-timebreak-mobile');
    addTimebreakButton.onclick = addTimebreak;
}

function addTimebreak(){
    let moduleList = document.getElementById(ID_MODULE_LIST_TRAINING);
    moduleList.appendChild(cloneTimeBreak());
    calculateTime();
    calculateSummary();
}

function initiateAddDaybreak(){
    let addDaybreakButton = document.getElementById('add-daybreak-mobile');
    addDaybreakButton.onclick = addDaybreak;
}

function addDaybreak(){
    const dayBreak = document.getElementsByClassName(CLASS_DAYBREAK)[0].cloneNode(true);
    let moduleList = document.getElementById(ID_MODULE_LIST_TRAINING);
    moduleList.appendChild(dayBreak);
    initiateTrashButton();
    calculateTime();
    calculateSummary();
}

/**
 * Populates the training plan with data from url or session storage
 */
function populateTrainingPlan(){
    const params = new URL(window.location).searchParams;
    const modules = params.get("modules");
    const trainingData = sessionStorage.getItem(TRAINING_DATA);
    const summaryData = sessionStorage.getItem(SUMMARY_DATA);
    const trainingTitle = sessionStorage.getItem(ID_TRAINING_TITLE);
    const trainingDescription = sessionStorage.getItem(ID_TRAINING_DESCRIPTION);
    let dataIncludesModule = false;
    if (trainingData) {
        let el = document.createElement('div');
        el.innerHTML = trainingData;
        dataIncludesModule = !!(el.querySelector('.module'));
    } 
    if (dataIncludesModule) {
        populateTrainingPlanFromCache(trainingData);
    } else {
        if (modules) {
            addModulesToTrainingPlan(modules.split(','));
        }
    }
    if (summaryData) {
        document.getElementById(ID_SUMMARY_EL).innerHTML = summaryData;
    }
    if (trainingTitle) {
        document.getElementById(ID_TRAINING_TITLE).innerHTML = trainingTitle;
    }
    if (trainingDescription) {
        document.getElementById(ID_TRAINING_DESCRIPTION).innerHTML = trainingDescription;
    }
    backupTrainingPlan();
}

/**
 * Adds a list of modules to the training plan
 * @param {String} modules list of modules e.g. [oer,bmc]
 */
function addModulesToTrainingPlan(modules){
    let moduleList = document.getElementById(ID_MODULE_LIST_TRAINING);
    modules.forEach((module) => {
        let el = document.getElementById(module);
        if (el) {
            moduleList.appendChild(el);
            insertIntroductionDuration(el);
            insertTimeBreaks(el);
        }
    });
    calculateTime();
    // insertDayBreaks();
    calculateSummary();
    updateAuthorList();
    updateTableOfContents();
}

/**
 * Dynamic Calculations
 */

function runDynamicCalculationsOnUpdate(evt) {
    let mod = evt.item;
    insertTimeBreaks(mod);
    calculateTime();
    // insertDayBreaks();
    clearPageBreaks();
    calculateSummary();
    updateAuthorList();
    updateTableOfContents();
    backupTrainingPlan();
}

function runDynamicCalculationsOnAdd(evt) {
    let mod;
    // In case a user selects multiple modules before dragging
    if (evt.items.length) {
        for (let i in evt.items) {
            mod = evt.items[i];
            insertTimeBreaks(mod);
            insertIntroductionDuration(mod);
            updateUrl(mod.id);
        }
    } else {
        // for cases where only one module is selected
        mod = evt.item;
        insertTimeBreaks(mod);
        insertIntroductionDuration(mod);
        updateUrl(mod.id);
    }
    calculateTime();
    // insertDayBreaks();
    clearPageBreaks();
    calculateSummary();
    updateAuthorList();
    updateTableOfContents();
    backupTrainingPlan();
}

/**
 * Removes pagebreak before module if preceded by daybreak
 */
function clearPageBreaks(){
    let modules = document.getElementById(ID_MODULE_LIST_TRAINING).querySelectorAll(`.${CLASS_MODULE}`);
    modules.forEach((module) => {
        let sibling = module.previousSibling;
        if (sibling && sibling.classList && sibling.classList.contains(CLASS_DAYBREAK)) {
            module.classList.toggle('pagebreak');
        }
    });
}

/**
 * Updates the url with module id after module is removed or added to training plan
 * @param {String} id module id
 */
function updateUrl(id){
    let url = new URL(window.location);
    let modules = url.searchParams.get('modules');
    if (modules) {
        let moduleSet = new Set(modules.split(','));
        if (moduleSet.has(id)) {
            moduleSet.delete(id);
        } else {
            moduleSet.add(id);
        }
        url.searchParams.set('modules', Array.from(moduleSet).join(','));
    } else {
        url.searchParams.set('modules', id);
    }
    sessionStorage.setItem(TRAINING_URL, url.href);
    window.history.pushState({}, '', url);
}

const INTRODUCTION_TEXT = 'Introduction';

/**
 * Inserts an introduction break based on the module's duration
 * @param {Node} mod Module node
 */
function insertIntroductionDuration(mod) {
    if (mod.className.includes(CLASS_MODULE)) {
        let resourceList = mod.querySelector('.resource-list');
        let MODULE_TIME_BREAK = cloneTimeBreak(mod.dataset.duration > 0 ? mod.dataset.duration : 15, INTRODUCTION_TEXT);
        MODULE_TIME_BREAK.classList.add(CLASS_INTRODUCTION);
        resourceList.prepend(MODULE_TIME_BREAK);
    }
}

/**
 * Deletes the introduction duration of a module
 * @param {Element} mod module element
 */
function deleteIntroductionDuration(mod){
    let MODULE_DURATION = mod.querySelector('.resource-list').firstChild;
    if (MODULE_DURATION && MODULE_DURATION.className && MODULE_DURATION.className.includes(CLASS_TIMEBREAK)) {
        let title = MODULE_DURATION.querySelector('.break-title');
        if (title.innerText === INTRODUCTION_TEXT) {
            MODULE_DURATION.remove();
        }
    }
}

function calculateTime() {
    let totalTime = 0;
    let clockTime = new Date(), startTime;
    let days = 0;

    let trainingstart = document.getElementById(CLASS_TRAININGSTART);
    const duration = parseInt(trainingstart.dataset.duration);
    clockTime = parseDatefromString(clockTime, trainingstart.dataset.start);
    startTime = clockTime;
    clockTime = insertClockTime(clockTime, duration, trainingstart);
    totalTime+=duration;
    days+=1;

    let moduleList = Array.from(document.getElementById(ID_MODULE_LIST_TRAINING).childNodes);
    moduleList = moduleList.filter(el => el.nodeName.includes('LI'));
    for (mod of moduleList) {
        if (mod.className.includes(CLASS_MODULE)) {
            const duration = 0;
            let moduleStartTime = clockTime;
            clockTime = insertClockTime(clockTime, duration, mod);
            totalTime+=duration;

            let resources = mod.querySelectorAll('.resource-list li');
            let moduleEndTime = clockTime;
            let timeBetweenDayBreaks = 0;
            for(let el of resources){
                if(el.className.includes(CLASS_DAYBREAK)){
                    clockTime = addDays(clockTime, 1);
                    clockTime = parseDatefromString(clockTime, el.dataset.start);
                    timeBetweenDayBreaks += clockTime - moduleEndTime;
                    days += 1;
                }
                const duration = parseInt(el.dataset.duration);
                clockTime = insertClockTime(clockTime, duration, el);
                moduleEndTime = clockTime;
                totalTime+=duration;
            }

            let moduleDurationEl = mod.querySelector(`.${CLASS_MODULEDURATION}`);

            const durationSplit = getDurationSplit(moduleEndTime - moduleStartTime - timeBetweenDayBreaks);
            let durationHtml = '<i class="fas fa-hourglass-half"></i> ';
            Object.keys(durationSplit).forEach((key, index) => {
                if (durationSplit[key]) {
                    durationHtml += index === 0 ? '' : ' ';
                    durationHtml += `${durationSplit[key]} ${key[0] === 'm' ? 'min' : key[0]}`;
                }
            });
            moduleDurationEl.innerHTML = durationHtml;


        } else if (mod.className.includes(CLASS_TIMEBREAK)) {
            const duration = parseInt(mod.dataset.duration);
            clockTime = insertClockTime(clockTime, duration, mod);
            totalTime+=duration;

        } else if(mod.className.includes(CLASS_DAYBREAK)){
            clockTime = addDays(clockTime, 1);
            let duration = parseInt(mod.dataset.duration);
            clockTime = parseDatefromString(clockTime, mod.dataset.start);
            clockTime = insertClockTime(clockTime, duration, mod);
            totalTime+=duration;
            days+=1;
        } 
    }

    updateSummaryDuration(days, totalTime);
    let startEndTimeDisplay = document.getElementById('start-end-time');
    startEndTimeDisplay.innerText = `Day 1 ${convertTimeToString(startTime)} -${days > 1 ? ' Day ' + days : ''} ${convertTimeToString(clockTime)}`;
}

function updateSummaryDuration(days, totalTime){
    let summaryDuration = getDurationSplit(totalTime*60*1000);
    document.querySelectorAll('.summary .summary-days').forEach((el) => el.innerText = days);
    document.querySelectorAll('.summary .summary-hours').forEach((el) => el.innerText = summaryDuration.hours);
    document.querySelectorAll('.summary .summary-minutes').forEach((el) => el.innerText = summaryDuration.minutes);
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// duration in ms
function getDurationSplit(duration){
    const hoursDiv = 1000 * 60 * 60;
    const hours = Math.floor(duration / hoursDiv);
    duration = duration - hours * hoursDiv;
    const minutesDiv = 1000 * 60;
    const minutes = Math.floor(duration / minutesDiv);
    return {'hours': hours, 'minutes': minutes};
}

function parseDatefromString(clockTime, daytime) {
    const splitDaytime = daytime.split(':');
    clockTime.setHours(splitDaytime[0]);
    clockTime.setMinutes(splitDaytime[1]);
    return clockTime;
}

function insertClockTime(clockTime, duration, mod) {
    let clockTimeSpan = getChildByClassName(mod, 'clock-time');
    if(clockTimeSpan == null){
        return clockTime;
    }
    const oldClockTime = new Date(clockTime);
    clockTime = new Date(clockTime.getTime() + duration * 60 * 1000);
    const clockTimeString = `${convertTimeToString(oldClockTime)} - ${convertTimeToString(clockTime)}`;
    clockTimeSpan.innerText = convertTimeToString(oldClockTime);
    mod.dataset.clock = clockTimeString;
    return clockTime;
}

function convertTimeToString(clockTime) {
    let hour = clockTime.getHours();
    let minute = clockTime.getMinutes();
    let temp = '' + ((hour > 12) ? hour - 12 : hour);
    if (hour == 0)
        temp = '12';
    temp += ((minute < 10) ? ':0' : ':') + minute;
    temp += (hour >= 12) ? 'pm' : 'am';
    return temp;
}

// this function returns the first child node matching the className it finds at the nearest point to the root
function getChildByClassName(el, className){
    let runLoop = true;
    let nextLevelChilds = el.childNodes;
    while(runLoop){
        let currentChilds = nextLevelChilds;
        nextLevelChilds = [];
        for(let i = 0; i < currentChilds.length; i++) {
            nextLevelChilds.push(...currentChilds[i].childNodes);
            if (currentChilds[i].className == className) {
                return currentChilds[i];
            }
        }
        if(nextLevelChilds.length == 0){
            return null;
        }
        currentChilds = nextLevelChilds;
    }
}

const difficultyLevels= {
    0: '-',
    1: 'easy',
    2: 'medium',
    3: 'advanced'
};

function calculateSummary() {
    let moduleListTraining = document.querySelectorAll(`#${ID_MODULE_LIST_TRAINING} .${CLASS_MODULE}`);
    let difficulty = 0;
    let participants = Number.MAX_VALUE;
    let trainer = 0;
    for(mod of moduleListTraining){
        let d = mod.dataset;
        difficulty = parseInt(d.difficulty) > difficulty ? parseInt(d.difficulty) : difficulty;
        participants = parseInt(d.participants) < participants ? parseInt(d.participants) : participants;
        trainer = parseInt(d.trainer) > trainer ? parseInt(d.trainer) : trainer;
    }
    if (moduleListTraining.length === 0) { 
        participants = 0;
        trainer = 0;
    }
    document.querySelectorAll('.summary .number-of-modules').forEach((el) => el.innerText = moduleListTraining.length);
    document.querySelectorAll('.summary .max-participants').forEach((el) => el.innerText = participants);
    document.querySelectorAll('.summary .min-trainers').forEach((el) => el.innerText = trainer);
    document.querySelectorAll('.summary .difficulty').forEach((el) => el.innerText = difficultyLevels[difficulty]);

    let resourceList = document.querySelectorAll(`#${ID_MODULE_LIST_TRAINING} .${CLASS_MODULE} .${CLASS_RESOURCE}`);
    let space = 0;
    let internet = 'no';
    let power = 'no';
    let materialCost = [];
    for(resource of resourceList){
        let d = resource.dataset;
        space = parseInt(d.space) > space ? parseInt(d.space) : space;
        if(d.internet === 'yes') internet = 'yes';
        if(d.power === 'yes') power = 'yes';

        if(alreadyInCostList(materialCost, d.name)){
            updateCostList(materialCost, d.name);
        } else {
            let newResource = {'name': d.name, 'cost': parseInt(d.cost), 'count': 1};
            materialCost.push(newResource);
        }
    }
    updateResourceCostList(materialCost);
}

function alreadyInCostList(l, name){
    return l.map(el => el['name']).includes(name);
}

function updateCostList(l, name){
    let currEl = l.filter(el => el['name'] == name)[0];
    currEl['count']+=1;
}

function updateResourceCostList(l){
    let resourceTable = document.querySelector('#resource-table');
    let costSum = 0;
    resourceTable.innerHTML = `
    <tr>
        <th class="quantity">Quantity</th>
        <th class="resource-name">Name of the resource</th>
        <th class="material-costs">Estimated Material Costs</th>
    </tr>`;
    l.forEach(el => {
        resourceTable.innerHTML+=`
        <tr>
            <th class="quantity"><input class="quantity-input" type="number" min="0" max="1000000" value="${el['count']}"></input></th>
            <th class="resource-name">${el['name']}</th>
            <th class="material-costs" data-cost="${el['cost']}">${el['count'] * el['cost']} $</th>
        </tr>`;
        costSum += el['count'] * el['cost'];
    });
    resourceTable.innerHTML+=`
    <tr class="result">
        <td colspan="2" class="label">Result:</td>
        <td id="total-price">${costSum} $</td>
    </tr>`;
    initiateEditResourceQuantity();
}

/**
 * Time Breaks
 */

const BREAK_INTERVAL = 90;

function initiateTimeBreaks() {
    let moduleListTraining = Array.from(document.getElementById(ID_MODULE_LIST_TRAINING).childNodes);
    moduleListTraining = moduleListTraining.filter(el => el.nodeName.includes('LI') && el.className.includes(CLASS_MODULE));
    for (mod of moduleListTraining) {
        insertTimeBreaks(mod);
    }
}

function insertTimeBreaks(mod) {
    if(!mod.className.includes(CLASS_MODULE)) {
        return;
    }
    let moduleList = Array.from(document.getElementById(ID_MODULE_LIST_TRAINING).childNodes);
    moduleList = moduleList.filter(el => el.nodeName.includes('LI') && el.className.includes(CLASS_MODULE));
    const isLastModule = moduleList[moduleList.length - 1] === mod;

    let durationSum = 0;
    let resources = document.querySelectorAll(`#${mod.id} .${CLASS_RESOURCE}`);
    for (resource of resources) {
        const duration = parseInt(resource.dataset.duration);
        const isLastResource = resources[resources.length - 1] === resource;
        let hasBreakAfter = false;
        let searchBreak = true;
        let currentElement = resource;
        while (searchBreak) { // we do it this way of some strange html (nodeName: '#text') siblings appear on the rendered side inbetween the list elems
            currentElement = currentElement.nextSibling;
            if (currentElement != null && currentElement.nodeName === 'LI' && (currentElement.className.includes(CLASS_TIMEBREAK) || currentElement.className.includes(CLASS_RESOURCE))) {
                if (currentElement.className.includes(CLASS_TIMEBREAK)) {
                    hasBreakAfter = true;
                    searchBreak = false;
                }
                searchBreak = false;
            }
            if (currentElement === null) {
                searchBreak = false;
            }
        }

        if (!isNaN(duration)) {
            durationSum += duration;
        }
        if (duration >= BREAK_INTERVAL && !(isLastModule && isLastResource) && !hasBreakAfter) {
            addTimeBreakAfter(resource);
            durationSum = 0;
        }
    }
}

function addTimeBreakAfter(resource) {
    resource.parentNode.insertBefore(cloneTimeBreak(), resource.nextSibling);
}

/**
 * Day Breaks
 */

const FINAL_HOUR = 17;

/**
 * Inserts a daybreak after 5pm and the end of the last resource
 */
function insertDayBreaks() {
    let modules = document.getElementById(ID_MODULE_LIST_TRAINING).querySelectorAll(`.${CLASS_MODULE}`);
    for (let module of modules) {
        const isLastModule = modules[modules.length - 1] === module;
        const nextModule = module.nextSibling;
        let resources = module.querySelectorAll(`.${CLASS_RESOURCE}`);
        for (let resource of resources) {
            let { start, end } = convertStringTimeToDate(resource.dataset.clock);
            const isLastResource = resources[resources.length - 1] === resource;
            let hasBreakAfter = false;
            let searchBreak = true;
            let currentElement = resource;
            while (searchBreak) { // we do it this way of some strange html (nodeName: '#text') siblings appear on the rendered side inbetween the list elems
                currentElement = currentElement.nextSibling;
                if (currentElement != null && currentElement.nodeName === 'LI' && currentElement.className.includes(CLASS_DAYBREAK)) {
                    hasBreakAfter = true;
                    searchBreak = false;
                }
                if (currentElement === null) {
                    searchBreak = false;
                }
            }

            if (nextModule != null && nextModule.nodeName === 'LI' && nextModule.className.includes(CLASS_DAYBREAK)) {
                hasBreakAfter = true;
            }
    
            if (end.getHours() >= FINAL_HOUR && !isLastResource && !hasBreakAfter) {
                addDayBreakAfter(resource);
            }
            if (end.getHours() >= FINAL_HOUR && isLastResource && !isLastModule && !hasBreakAfter) {
                addDayBreakAfter(module);
            }
        }
    }
}

/**
 * Inserts a DayBreak after a resource
 * @param {Node} resource Resource element
 */
function addDayBreakAfter(resource) {
    resource.parentNode.insertBefore(cloneDayBreak(), resource.nextSibling);
    calculateTime();
}

/**
 * Converts a string clocktime to start and end JS Dates
 * @param {String} time clock time of a given module/resource/timebreak/daybreak
 * @returns {{ start: Date, end: Date }} start and end clocktimes as JS Dates
 */
function convertStringTimeToDate(time){
    let start = new Date(), end = new Date();
    let [startTime, endTime] = time.split('-').map((t) => t.trim()).map((t) => {
        if (/p/.test(t)) {
            let digits = t.replace(/[a-z]+/g, '');
            let [hours, minutes] = digits.split(':').map((d) => Number(d));
            hours += 12;
            return { hours, minutes };
        } else {
            let digits = t.replace(/[a-z]+/g, '');
            let [hours, minutes] = digits.split(':').map((d) => Number(d));
            return { hours, minutes };
        }
    });;
    start.setHours(startTime.hours, startTime.minutes);
    end.setHours(endTime.hours, endTime.minutes);
    return { start, end };
}

/**
 * Word Cloud Filter
 */

const CLASS_SELECTED = 'selected';
const ID_WORDCLOUD = 'wordcloud';
const ID_SHOW_ALL_CATEGORIES = 'show-all-modules';
const ID_SHOW_TAGS_BUTTON = 'show-tags-button';

function initiateWordcloudFilter() {
    const wordcloud = document.getElementById(ID_WORDCLOUD).getElementsByTagName('li');
    for (li of wordcloud) {
        li.onclick = updateWordcloudFilter;
    }
}

function updateWordcloudFilter() {
    if (this.id === ID_SHOW_ALL_CATEGORIES) {
        if (!this.className.includes(CLASS_SELECTED)) {
            this.className = this.className.concat(CLASS_SELECTED);
            showAllModules();
            return;
        }
    }
    if (!this.className.includes(CLASS_SELECTED)) {
        this.className = this.className.concat(CLASS_SELECTED);
    } else {
        const thisClasses = this.className.split(' ');
        const thisClassesWithoutSelected = thisClasses.filter(className => className != CLASS_SELECTED);
        this.className = thisClassesWithoutSelected.join(' ');
    }
    updateSelectableModulesList();
}

function unselectAllCategories() {
    const wordcloud = Array.from(document.getElementById(ID_WORDCLOUD).getElementsByTagName('li'));
    for (category of wordcloud) {
        if (category.id != ID_SHOW_ALL_CATEGORIES) {
            const categoryClasses = category.className.split(' ');
            const categoryClassesWithoutSelected = categoryClasses.filter(className => className != CLASS_SELECTED);
            category.className = categoryClassesWithoutSelected.join(' ');
        }
    }
}

function showAllModules() {
    unselectAllCategories()
    const sideBarModules = Array.from(document.getElementById(ID_MODULE_LIST_SIDE_BAR).getElementsByClassName(CLASS_MODULE));
    for (mod of sideBarModules) {
        mod.style.display = '';
    }
}

function hideAllModules() {
    unselectAllCategories()
    const sideBarModules = Array.from(document.getElementById(ID_MODULE_LIST_SIDE_BAR).getElementsByClassName(CLASS_MODULE));
    for (mod of sideBarModules) {
        mod.style.display = 'none';
    }
}

function updateSelectableModulesList() {
    const wordcloud = Array.from(document.getElementById(ID_WORDCLOUD).getElementsByTagName('li'));
    const wordcloudSelectedCategories = wordcloud.filter(li => li.className.includes(CLASS_SELECTED));
    const selectedCategories = wordcloudSelectedCategories.map(li => li.innerText);

    const sideBarModules = Array.from(document.getElementById(ID_MODULE_LIST_SIDE_BAR).getElementsByClassName(CLASS_MODULE));

    let showAllModulesCategory = document.getElementById(ID_SHOW_ALL_CATEGORIES)
    const showAllModulesCategoryClasses = showAllModulesCategory.className.split(' ');
    const showAllModulesCategoryClassesWithoutSelected = showAllModulesCategoryClasses.filter(className => className != CLASS_SELECTED);
    showAllModulesCategory.className = showAllModulesCategoryClassesWithoutSelected.join(' ');

    if (selectedCategories.length == 0) {
        showAllModules();
        let all = document.getElementById('show-all-modules');
        all.className = all.className.concat(CLASS_SELECTED);
        return;
    }

    for (mod of sideBarModules) {
        const modTags = mod.dataset.tags;
        
        for (category of selectedCategories) {
            if (modTags.includes(category)) {
                mod.style.display = '';
                break; // --> change around here to implement "AND" filter style. bahaves atm like "OR"
            } else {
                mod.style.display = 'none';
            }
        }
    }
}

function initiateSearchButton() {
    const params = new URL(window.location).searchParams;
    const searchText = params.get('search');
    let button = document.getElementById('search-bar-button');
    button.onclick = updateModulesBySearch;
    let form = document.getElementById('search-bar-form');
    clickButtonOnEnter(form, '#search-bar-input', '#search-bar-button');
    let input = document.getElementById('search-bar-input');
    input.oninput = updateModulesBySearch;
    if (searchText) {
        input.value = searchText;
        updateModulesBySearch();
    }
    let resetButton = document.getElementById('reset-search');
    resetButton.onclick = resetSearch;
}

/**
 * Clears the search filter
 */
function resetSearch(){
    let url = new URL(window.location);
    let input = document.getElementById('search-bar-input');
    input.value = '';
    showAllModules();
    let all = document.getElementById('show-all-modules');
    all.className = all.className.concat(CLASS_SELECTED);
    url.searchParams.delete('search');
    sessionStorage.setItem(TRAINING_URL, url.href);
    window.history.pushState({}, '', url);
}

/**
 * filters modules based on user input
 * @returns 
 */
function updateModulesBySearch(){
    let url = new URL(window.location);
    const searchWord = document.getElementById('search-bar-input').value.toLowerCase().trim();
    const sideBarModules = Array.from(document.getElementById(ID_MODULE_LIST_SIDE_BAR).getElementsByClassName(CLASS_MODULE));
    if (searchWord.length > 0) {
        for (mod of sideBarModules) {
            const modName = mod.dataset.name.toLowerCase();
            const modDescription = mod.dataset.description.toLowerCase();
            if (modName.includes(searchWord) || modDescription.includes(searchWord)) {
                mod.style.display = '';
            } else {
                mod.style.display = 'none';
            }
        }
    } else {
        showAllModules();
        let all = document.getElementById('show-all-modules');
        all.className = all.className.concat(CLASS_SELECTED);
        return;
    }
    url.searchParams.set('search', searchWord);
    sessionStorage.setItem(TRAINING_URL, url.href);
    window.history.pushState({}, '', url);
}

/**
 * Activates the button for showing/hiding filter tags
 */
function initiateShowTagsButton() {
    let button = document.getElementById(ID_SHOW_TAGS_BUTTON);
    button.onclick = toggleShowTags;
}

/**
 * Shows/hides filter tags
 */
function toggleShowTags () {
    let tags = document.getElementById(ID_WORDCLOUD);
    let button = document.getElementById(ID_SHOW_TAGS_BUTTON);
    if (tags.style.display == 'block') {
        tags.style.display = 'none';
        button.innerHTML = `<i class="fas fa-angle-down"></i>`;
        button.dataset.tooltip = 'show tags';
    } else {
        tags.style.display = 'block';
        button.innerHTML = `<i class="fas fa-angle-up"></i>`;
        button.dataset.tooltip = 'hide tags';
    }
}

/**
 * Author list
 */
function updateAuthorList(){
    let moduleListEl = document.getElementById('module-list-training');
    let authorList =  moduleListEl.querySelectorAll('.author');
    let authorsWithResources = {};
    let identifiedResources = [];
    let identifiedAuthors = [];
    authorList.forEach((authorEl) => {
        let { author, resource, resourceUrl, resourceLicense } = authorEl.dataset;
        if (!identifiedResources.includes(resource)) {
            let license = convertMDLinkToObject(resourceLicense);
            let newResource = {
                name: resource,
                url: resourceUrl,
                license,
            };
            let authors = convertMultipleMDLinksToArray(author);
            authors.forEach((singleAuthor) => {
                if (!identifiedAuthors.includes(singleAuthor.name)) {
                    authorsWithResources[singleAuthor.name] = {};
                    authorsWithResources[singleAuthor.name]['url'] = singleAuthor.url;
                    authorsWithResources[singleAuthor.name]['resources'] = [];
                    identifiedAuthors.push(singleAuthor.name);
                }
                authorsWithResources[singleAuthor.name]['resources'].push(newResource);
            });
            identifiedResources.push(resource);
        }
    });
    let html = '';
    for (author in authorsWithResources) {
        // single author item that contains their name, url, and resources
        let item = authorsWithResources[author];

        let authorHtml = `<li class="author-info"><p><a href="${item.url}" target="_blank"><strong>${author}</strong></a><span class="display-print"> (${item.url})</span></p>`;
        let resourceListEls = '';
        for (resource in item.resources) {
            // Single resource item that includes the name, url, and license of the resource
            let resourceItem = item.resources[resource];

            resourceListEls +=`<li><a href="${resourceItem.url}" target="_blank">${resourceItem.name}</a>`;
            // Add resource link if it exists
            if (resourceItem.url) {
                resourceListEls += `<span class="display-print"> (${resourceItem.url})</span>`;
            }
            // Add license
            if (resourceItem.license.name) {
                resourceListEls += `. License: <a target="_blank" href="${resourceItem.license.url}">${resourceItem.license.name}</a>`;
            }
            // Add license url if it exists
            if (resourceItem.license.url) {
                resourceListEls+= `<span class="display-print"> (${resourceItem.license.url})</span>`;
            }
            // Add closing li tag
            resourceListEls += `</li>`;
        }
        authorHtml += `<ul>${resourceListEls}</ul></li>`;
        html += authorHtml;
    }
    if (html !== '') {
        let referenceListEl = document.getElementById('reference-list');
        referenceListEl.innerHTML = html;
    }
}

/**
 * Creates an object with the name and url from a markdown link
 * @param {String} link markdown link
 * @returns {{ name: String, url: String }}
 */
function convertMDLinkToObject(link){
    let result = { name: '', url: '' };
    if (!link) return result;
    if(link[0] == '['){
        let regex = /[\[\]\)]/g;
        let [ name, url ] = link.replace(regex, '').split('(');
        result.name = name;
        result.url = url;
        return result;
    }
    result.name = link;
    return result;
}

/**
 * Converts multiple Markdown links separated by commas to array of { name, url } objects
 * @param {String} links
 * @returns {Array<{ name: String, url: String }>} 
 */
function convertMultipleMDLinksToArray(links){
    let result = [];
    if (links.includes(',')) {
        let singleLinks = links.split(',');
        singleLinks.forEach((link) => {
            let obj = convertMDLinkToObject(link.trim());
            result.push(obj);
        });
        return result;
    }
    let obj = convertMDLinkToObject(links);
    result.push(obj);
    return result;
}

/**
 * Initiates the button for expanding/contracting the author list
 */
function initiateAuthorListToggleButton(){
    let button = document.getElementById('reference-button');
    button.onclick = expandAuthorList;
}

/**
 * Expands the list of authors
 */
function expandAuthorList(){
    let referenceListEl = document.getElementById('reference-list');
    referenceListEl.style.display = 'block';
    this.innerHTML = '<i class="fas fa-angle-up"></i>';
    this.onclick = contractAuthorList;
}

/**
 * Contracts the list of authors
 */
function contractAuthorList(){
    let referenceListEl = document.getElementById('reference-list');
    referenceListEl.style.display = 'none';
    this.innerHTML = '<i class="fas fa-angle-down"></i>';
    this.onclick = expandAuthorList;
}

/**
 * Allows user to add custom notes
 */
function initiateEditNotes(){
    let editButtons = document.querySelectorAll(`.edit-trainer-notes-button`);
    for (let editButton of editButtons) {
        editButton.onclick = showEditNotes;
    }
    let submitButtons = document.querySelectorAll(`.submit-notes`);
    for (let submitButton of submitButtons) {
        submitButton.onclick = submitNotes;
    }
    let dismissButtons = document.querySelectorAll(`.close-notes-popup`);
    for (let dismissButton of dismissButtons) {
        dismissButton.onclick = dismissEditNotes;
    }
    let resetButtons = document.querySelectorAll(`.reset-notes`);
    for (let resetButton of resetButtons) {
        resetButton.onclick = clearNote;
    }
}

function showEditNotes(){
    let popupEl = this.parentNode.querySelector('.edit-trainer-notes-popup') ?? this.parentNode.parentNode.querySelector('.edit-trainer-notes-popup');
    popupEl.style.transform = 'scale(1,1)';
}

function dismissEditNotes() {
    let popupEl = this.parentNode.parentNode.parentNode;
    popupEl.style.transform = 'scale(0,0)';
}

function submitNotes(){
    let popupEl = this.parentNode.parentNode.parentNode.parentNode.parentNode;
    popupEl.style.transform = 'scale(0,0)';

    let parentEl = popupEl.parentNode;
    let displayEl = parentEl.querySelector('.trainer-notes-display');
    let form = this.parentNode.parentNode;
    let newNote = getChildByClassName(form, 'notes').value;
    displayEl.innerText = newNote;
    let addNotesButton = parentEl.querySelector('.edit-trainer-notes-button');
    if (newNote != '') {
        addNotesButton.dataset.tooltip = 'Edit notes';
        addNotesButton.innerHTML = '<i class="far fa-edit"></i>';
    } else {
        addNotesButton.innerHTML = '+';
    }
    backupTrainingPlan();
}

/**
 * Clears the input textfield for the note. It does not save the changes.
 */
function clearNote(){
    let form = this.parentNode.parentNode;
    let inputEl = form.querySelector('.notes');
    inputEl.value = "";
}

/**
 * Enables input action on 'Enter' keypress
 * @param {Element} form HTML form element
 * @param {String} inputSelector query selector for the input
 * @param {String} buttonSelector query selector for the button
 */
function clickButtonOnEnter(form, inputSelector, buttonSelector){
    let input = form.querySelector(inputSelector);
    input.addEventListener("keypress", function(event) {
        // If the user presses the "Enter" key on the keyboard
        if (event.key === "Enter") {
          // Cancel the default action, if needed
          event.preventDefault();
          // Trigger the button element with a click
          form.querySelector(buttonSelector).click();
        }
    });
}

/**
 * Updates the table of contents when a module is added or deleted in the main area
 */
function updateTableOfContents(){
    let items = document.querySelectorAll(`#${ID_MODULE_LIST_TRAINING} li`);
    let modules = document.querySelectorAll(`#${ID_MODULE_LIST_TRAINING} .${CLASS_MODULE}`);
    let tocList = document.getElementById('toc-list'); 
    if (modules.length > 0) {
        let contentList = '<h4>Day 1</h4>';
        let day = 1, name;
        for (let item of items) {
            if (item.classList.contains(CLASS_DAYBREAK)){
                const isLastItem = items[items.length - 1] === item;
                if (!isLastItem) {
                    day++;
                    contentList += `<h4>Day ${day}</h4>`;
                    const clockTime = parseDatefromString(new Date(), item.dataset.start);
                    contentList += `<li><span>${name}</span><span>${convertTimeToString(clockTime)}</span></li>`;
                }
            }
            if (item.classList.contains(CLASS_MODULE)){;
                name = item.dataset.name;
                let { start, end } = convertStringTimeToDate(item.dataset.clock);
                contentList += `<li><span>${name}</span><span>${convertTimeToString(start)}</span></li>`;
            }
        }
        tocList.innerHTML = contentList;
    } else {
        tocList.innerHTML = '';
    }
}

/**
 * Initiates the button for expanding/contracting the table of contents
 */
function initiateTableOfContentsToggleButton(){
    let button = document.getElementById('toc-button');
    button.onclick = expandTableOfContents;
}

/**
* Expands the table of contents
*/
function expandTableOfContents(){
   let listEl = document.getElementById('toc-list-wrapper');
   listEl.style.display = 'block';
   this.innerHTML = '<i class="fas fa-angle-up"></i>';
   this.onclick = contractTableOfContents;
}

/**
* Contracts the table of contents
*/
function contractTableOfContents(){
   let listEl = document.getElementById('toc-list-wrapper');
   listEl.style.display = 'none';
   this.innerHTML = '<i class="fas fa-angle-down"></i>';
   this.onclick = expandTableOfContents;
}

/**
 * Open links enclosed with the class open-new-tab in a new tab e.g. licenses, authors
 */
function openLinksInNewTab(){
    let links = document.querySelectorAll('.open-new-tab a');
    links.forEach((link) => {
        link.setAttribute("target", "_blank");
    });
}

/**
 * Caches the training plan
 */
function backupTrainingPlan(){
    const savingIndicator = document.getElementById('saving');
    savingIndicator.classList.add('show');
    const trainingData = document.getElementById(ID_MODULE_LIST_TRAINING).innerHTML.replace(/>\s+</g,'><');
    const summaryData = document.getElementById(ID_SUMMARY_EL).innerHTML;
    const trainingTitle = document.getElementById(ID_TRAINING_TITLE).innerHTML;
    const trainingDescription = document.getElementById(ID_TRAINING_DESCRIPTION).innerHTML;
    sessionStorage.setItem(TRAINING_DATA, trainingData);
    sessionStorage.setItem(SUMMARY_DATA, summaryData);
    sessionStorage.setItem(ID_TRAINING_TITLE, trainingTitle);
    sessionStorage.setItem(ID_TRAINING_DESCRIPTION, trainingDescription);
    setTimeout(() => savingIndicator.classList.remove('show'), 1000);
}

/**
 * Populates the training plan with data from session storage
 * @param {String} cache cache from session storage
 */
function populateTrainingPlanFromCache(cache){
    document.getElementById(ID_MODULE_LIST_TRAINING).innerHTML = cache;
    initiateSortable();
    removeModulesFromSidebar();
    initiateTimeEdit();
    initiateTrashButton();
    initiateEditNotes();
    initiateEditTitle();
    updateAuthorList();
    updateTableOfContents();
    initiateTableOfContentsToggleButton();
}

/**
 * Deletes modules in the training plan from the sidebar
 */
function removeModulesFromSidebar(){
    let trainingModules = document.getElementById(ID_MODULE_LIST_TRAINING).querySelectorAll(`.${CLASS_MODULE}`);
    let sideBarModules = document.getElementById(ID_MODULE_LIST_SIDE_BAR);
    trainingModules.forEach((module) => {
        let el = sideBarModules.querySelector(`#${module.id}`);
        if (el) {
            el.remove();
        }
    });
}

/**
 * and here we go
 */
window.onload = function () {
    initiateSortable();
    initiateWordcloudFilter();
    initiateEditTitle();
    initiateTimeBreaks();
    initiateTrashButton();
    initiateTimeEdit();
    initiateMobileButtons();
    calculateTime();
    calculateSummary();
    initiateEditNotes();
    initiateAuthorListToggleButton();
    initiateSearchButton();
    initiateShowTagsButton();
    initiateEditSummary();
    initiateTableOfContentsToggleButton();
    populateTrainingPlan();
    clearPageBreaks();
    openLinksInNewTab();
}