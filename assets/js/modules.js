(function ($) {

  // Shuffle 

  var Shuffle = window.Shuffle;

  class Demo {
      constructor(element) {
          this.element = element;
          this.difficulties = Array.from(document.querySelectorAll('.filter-difficulty button'));
          this.participants = Array.from(document.querySelectorAll('.filter-participant button'));
          this.tags = Array.from(document.querySelectorAll('.filter-tag button'));
          this.reset = Array.from(document.querySelectorAll('.filter-reset'));
          this.shuffle = new Shuffle(element, {
              itemSelector: '.module-item',
              sizer: element.querySelector('.my-sizer-element'),
          });

          // Log events.
          //this.addShuffleEventListeners();
          this.filters = {
              difficulties: [],
              participants: [],
              tags: [],
          };
          this._bindEventListeners();

          this.addSorting();
          this.addSearchFilter();
      }

      /**
       * Shuffle uses the CustomEvent constructor to dispatch events. You can listen
       * for them like you normally would (with jQuery for example).
       */
      addShuffleEventListeners() {
          this.shuffle.on(Shuffle.EventType.LAYOUT, (data) => {
              console.log('layout. data:', data);
          });
          this.shuffle.on(Shuffle.EventType.REMOVED, (data) => {
              console.log('removed. data:', data);
          });
      }

      /**
       * Bind event listeners for when the filters change.
       */
      _bindEventListeners = function () {
          this._onDifficultyChange = this._handleDifficultyChange.bind(this);
          this._onParticipantChange = this._handleParticipantChange.bind(this);
          this._onTagChange = this._handleTagChange.bind(this);
          this._onResetClick = this._resetFilters.bind(this);

          this.difficulties.forEach(function (button) {
              button.addEventListener('click', this._onDifficultyChange);
          }, this);

          this.tags.forEach(function (button) {
            button.addEventListener('click', this._onTagChange);
          }, this);

          this.participants.forEach(function (button) {
            button.addEventListener('click', this._onParticipantChange);
          }, this);

          this.reset.forEach(function (button) {
              button.addEventListener('click', this._onResetClick);
          }, this);

      };


      /**
       * Get the values of each `active` button.
       * @return {Array.<string>}
       */

      _getCurrentDifficultyFilters = function () {
          return this.difficulties.filter(function (button) {
              return button.classList.contains('active');
          }).map(function (button) {
              return button.getAttribute('data-difficulty');
          });
      };

      _getCurrentTagFilters = function () {
        return this.tags.filter(function (button) {
            return button.classList.contains('active');
        }).map(function (button) {
            return button.getAttribute('data-tag');
        });
      };

      _getCurrentParticipantFilters = function () {
          return this.participants.filter(function (button) {
              return button.classList.contains('active');
          }).map(function (button) {
              return button.getAttribute('data-participant');
          });
      };

      _resetFilters = function () {
          var allFilterButtons = Array.from(document.querySelectorAll('.filter-difficulty button, .filter-tag button, .filter-participant button'));

          // remove all "active" classes
          allFilterButtons.forEach(function (btn) {
              btn.classList.remove('active');
          });

          //filter() (filter aktualisieren)
          this.filters.difficulties = this._getCurrentDifficultyFilters();
          this.filters.participants = this._getCurrentParticipantFilters();
          this.filters.tags = this._getCurrentTagFilters();
          this.filter();
      }

      /**
       * A difficulty  state changed, update the current filters and filte.r
       */
       _handleDifficultyChange = function (evt) {
          var button = evt.currentTarget;
          let similarButtons = [];
          this.difficulties.forEach((btn) => {
            if (btn.dataset.difficulty == button.dataset.difficulty) {
              similarButtons.push(btn);
            }
          })

          if (button.getAttribute('data-difficulty') == 'All') {
              // remove all "active" classes
              this.difficulties.forEach(function (btn) {
                  btn.classList.remove('active');
              });
          } else {

              if (button.classList.contains('active')) {
                  button.classList.remove('active');
                  similarButtons.forEach((btn) => btn.classList.remove('active'));
              } else {
                  button.classList.add('active');
                  similarButtons.forEach((btn) => btn.classList.add('active'));
              }
          }

          this.filters.difficulties = this._getCurrentDifficultyFilters();
          this.filter();
      };

      /**
       * A tag state changed, update the current filters and filter
       */
      _handleTagChange = function (evt) {
        var button = evt.currentTarget;
        let similarButtons = [];
        this.tags.forEach((btn) => {
            if (btn.dataset.tag == button.dataset.tag) {
                similarButtons.push(btn);
            }
        })

        if (button.getAttribute('data-tag') == 'All') {
            // remove all "active" classes
            this.tags.forEach(function (btn) {
                btn.classList.remove('active');
            });
        } else {
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                similarButtons.forEach((btn) => btn.classList.remove('active'));
            } else {
                button.classList.add('active');
                similarButtons.forEach((btn) => btn.classList.add('active'));
            }
        }

        this.filters.tags = this._getCurrentTagFilters();
        this.filter();
    };

      /**
       * A participant button was clicked. Update filters and display.
       * @param {Event} evt Click event object.
       */
      _handleParticipantChange = function (evt) {
        var button = evt.currentTarget;
        let similarButtons = [];
        this.participants.forEach((btn) => {
            if (btn.dataset.participant == button.dataset.participant) {
              similarButtons.push(btn);
            }
        })

        if (button.getAttribute('data-participant') == 'All') {
            // remove all "active" classes
            this.participants.forEach(function (btn) {
                btn.classList.remove('active');
            });
        } else {

            // Treat these buttons like radio buttons where only 1 can be selected.
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                similarButtons.forEach((btn) => btn.classList.remove('active'));
            } else {
                this.participants.forEach(function (btn) {
                    btn.classList.remove('active');
                });

                button.classList.add('active');
                similarButtons.forEach((btn) => btn.classList.add('active'));
            }
        }

        this.filters.participants = this._getCurrentParticipantFilters();
        this.filter();
    };


      /**
       * Filter shuffle based on the current state of filters.
       */
      filter = function () {
          console.log('function filter()\n this.hasActiveFilters():', this.hasActiveFilters(), '\n this.filters: ', this.filters);
          if (this.hasActiveFilters()) {
              this.shuffle.filter(this.itemPassesFilters.bind(this));
          } else {
              this.shuffle.filter(Shuffle.ALL_ITEMS);
          }
      };

      /**
      * If any of the arrays in the `filters` property have a length of more than zero,
      * that means there is an active filter.
      * @return {boolean}
      */
      hasActiveFilters = function () {
          return Object.keys(this.filters).some(function (key) {
              return this.filters[key].length > 0;
          }, this);
      };

      /**
       * Determine whether an element passes the current filters.
       * @param {Element} element Element to test.
       * @return {boolean} Whether it satisfies all current filters.
       */
      itemPassesFilters = function (element) {
          // extending the prototype of the Array,
          // with a named method/function:
          Array.prototype.commonElements = function (arr2) {

              // iterating over the 'this' array:
              return this.some(function (el) {

                  // looks for the array-value
                  // represented by 'el', and
                  // comparing the returned index
                  // to see if it's greater than
                  // -1 (and so is found in 'this' array):
                  return arr2.indexOf(el) > -1;
              });
          }

          var difficulties = this.filters.difficulties;
          var participants = this.filters.participants;
          var tags = this.filters.tags;
          var difficulty = JSON.parse(element.getAttribute('data-difficulties'));
          var participant = JSON.parse(element.getAttribute('data-participants'));
          var tag = (element.dataset.tags).split(',').map((t) => t.trim());

          // If there are active filters and this difficulty is not in the filter array 
          if (difficulties.length > 0 && !difficulties.commonElements(difficulty)) {
              return false;
          }

          // If there are active filters and this participant is not in the filter array 
          if (participants.length > 0 && !participants.commonElements(participant)) {
            return false;
          }

          if (tags.length > 0 && !tags.commonElements(tag)) {
            return false;
          }

          return true;
      };


      _removeActiveClassFromChildren(parent) {
          const { children } = parent;
          for (let i = children.length - 1; i >= 0; i--) {
              children[i].classList.remove('active');
          }
      }

      addSorting() {
          const buttonGroup = document.querySelector('.sort-options');
          if (!buttonGroup) {
              return;
          }
          buttonGroup.addEventListener('change', this._handleSortChange.bind(this));
      }

      _handleSortChange(evt) {
          // Add and remove `active` class from buttons.
          const buttons = Array.from(evt.currentTarget.children);
          buttons.forEach((button) => {
              if (button.querySelector('input').value === evt.target.value) {
                  button.classList.add('active');
              } else {
                  button.classList.remove('active');
              }
          });

          // Create the sort options to give to Shuffle.
          const { value } = evt.target;
          let options = {};

          function sortByDate(element) {
              return element.getAttribute('data-created');
          }

          function sortByTitle(element) {
              return element.getAttribute('data-title').toLowerCase();
          }

          if (value === 'date-created') {
              options = {
                  reverse: true,
                  by: sortByDate,
              };
          } else if (value === 'title') {
              options = {
                  by: sortByTitle,
              };
          }
          this.shuffle.sort(options);
      }

      // Advanced filtering
      addSearchFilter() {
          const searchInput = document.querySelector('.js-shuffle-search');
          const clearSearch = document.getElementById('reset-search');
          if (!searchInput) {
            return;
          }
          searchInput.addEventListener('keyup', this._handleSearchKeyup.bind(this));
          clearSearch.addEventListener('click', this._clearSearch.bind(this));
      }

      /**
       * Filter the shuffle instance by items with a title that matches the search input.
       * @param {Event} evt Event object.
       */
      _handleSearchKeyup(evt) {
          const searchText = evt.target.value.toLowerCase();
          let url = new URL(sessionStorage.getItem(TRAINING_URL));
          url.searchParams.set('search', searchText);
          sessionStorage.setItem(TRAINING_URL, url.href);
          this.shuffle.filter((element, shuffle) => {
              // If there is a current filter applied, ignore elements that don't match it.
              if (shuffle.group !== Shuffle.ALL_ITEMS) {
                  // Get the item's groups.
                  const groups = JSON.parse(element.getAttribute('data-difficulties'));
                  const isElementInCurrentGroup = groups.indexOf(shuffle.group) !== -1;
                  // Only search elements in the current group
                  if (!isElementInCurrentGroup) {
                      return false;
                  }
              }
              const titleText = element.dataset.name.toLowerCase();
              const description = element.dataset.description.toLowerCase();
              return titleText.includes(searchText) || description.includes(searchText);
          });
      }

      _clearSearch(evt){
        let searchInput = document.querySelector('.js-shuffle-search');
        searchInput.value = '';
        this.filter();
        let url = new URL(sessionStorage.getItem(TRAINING_URL));
        url.searchParams.delete('search');
        sessionStorage.setItem(TRAINING_URL, url.href);
      }
  }

  document.addEventListener('DOMContentLoaded', function () {
      window.demo = new Demo(document.querySelector('.my-shuffle-container'));
  });

})(jQuery);