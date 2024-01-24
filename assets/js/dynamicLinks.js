const TRAINING_URL = 'trainingUrl';
const TRAINING_DATA = 'training-data';
const SUMMARY_DATA = 'summary-data';
const ID_TRAINING_TITLE = 'training-title';
const ID_TRAINING_DESCRIPTION = 'training-description';

function initializeModuleItems(){
    let modules = document.getElementsByClassName('module-item');
    for (let module of modules) {
        module.onclick = addToQuery;
    }
}

function addToQuery(){
    let item = this;
    let checkIcon = item.querySelector('.select-check');
    let moduleContent = item.querySelector('.module-content');
    let id = item.dataset.id;
    let url = new URL(sessionStorage.getItem(TRAINING_URL));
    let modules = url.searchParams.get('modules');
    if (modules) {
        let moduleSet = new Set(modules.split(','));
        if (moduleSet.has(id)) {
            moduleSet.delete(id);
            checkIcon.innerHTML = '<i class="far fa-circle"></i>';
            checkIcon.dataset.tooltip = 'select';
        } else {
            moduleSet.add(id);
            checkIcon.innerHTML = '<i class="far fa-check-circle"></i>';
            checkIcon.dataset.tooltip = 'deselect';
        }
        url.searchParams.set('modules', Array.from(moduleSet).join(','));
    } else {
        url.searchParams.set('modules', id);
        checkIcon.innerHTML = '<i class="far fa-check-circle"></i>';
        checkIcon.dataset.tooltip = 'deselect';
    }
    moduleContent.classList.toggle('selected');
    sessionStorage.setItem(TRAINING_URL, url.href);
}

function refreshSelection(){
    let href = sessionStorage.getItem(TRAINING_URL) ?? window.location.href + 'training';
    sessionStorage.setItem(TRAINING_URL, href);
    let url = new URL(href);
    let modules = url.searchParams.get('modules');
    if (modules){
        modules.split(',').forEach((module) => {
            let el = document.getElementById(module);
            if (el) {
                let checkIcon = el.querySelector('.select-check');
                let moduleContent = el.querySelector('.module-content');
                moduleContent.classList.toggle('selected');
                checkIcon.innerHTML = '<i class="far fa-check-circle"></i>';
                checkIcon.dataset.tooltip = 'deselect';
            }
        });
    }
}

window.onload = function(){
    refreshSelection();
    initializeModuleItems();
}