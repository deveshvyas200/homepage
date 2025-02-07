document.addEventListener('DOMContentLoaded', function() {
    const addBookmarkBtn = document.getElementById('add-bookmark-btn');
    const addBookmarkPopup = document.getElementById('add-bookmark-popup');
    const closeButton = document.querySelector('.close-button');
    const bookmarkForm = document.getElementById('bookmark-form');
    const categorySelect = document.getElementById('category');
    const bookmarkContainer = document.querySelector('.bookmark-container');
    const themeToggle = document.getElementById('theme-toggle');
    const confirmationPopup = document.createElement('div');
    confirmationPopup.classList.add('confirmation-popup');
    const importBookmarksBtn = document.getElementById('import-bookmarks-btn');
    const importPopup = document.getElementById('import-popup');
    const importCategorySelect = document.getElementById('import-category');
    const processBookmarkFileBtn = document.getElementById('process-bookmark-file');
    const bookmarkFile = document.getElementById('bookmark-file');
    const importCloseButton = document.querySelector('.import-close-button');
    const addCustomCategoryBtn = document.getElementById('add-custom-category-btn');
    const searchInput = document.getElementById('search-input'); //Get Search input

    let bookmarks = JSON.parse(localStorage.getItem('bookmarks')) || {};
    let darkMode = localStorage.getItem('darkMode') === 'enabled';
    let bookmarkToRemove = null; // To store info on current bookmark removing
    let categoryToRemove = null; // To store info on current category removing
    let bookmarkToEdit = null; // To store info for edit bookmark

    // Theme Toggle functionality
    function enableDarkMode() {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
        themeToggle.textContent = 'Light Mode';
    }

    function disableDarkMode() {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
        themeToggle.textContent = 'Dark Mode';
    }

    if (darkMode) {
        enableDarkMode();
    }

    themeToggle.addEventListener('click', () => {
        darkMode = !darkMode;
        if (darkMode) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
    });

    const defaultCategories = ['Airdrops 💰']; // Only Airdrops as default
    let userCategories = JSON.parse(localStorage.getItem('userCategories')) || [];
    let allCategories = [...new Set([...defaultCategories, ...userCategories])];

    // Save categories to localStorage
    function saveCategories() {
        localStorage.setItem('userCategories', JSON.stringify(allCategories.filter(cat => !defaultCategories.includes(cat))));
    }

    // Handle File Import
    processBookmarkFileBtn.addEventListener('click', () => {
        const selectedCategory = importCategorySelect.value;
        const file = bookmarkFile.files[0];

        if (!file) {
            alert('Please select an HTML file to import.');
            return;
        }

        const reader = new FileReader();

        reader.onload = function(event) {
            const htmlContent = event.target.result;
            const newBookmarks = extractBookmarksFromHTML(htmlContent);
            // Add the new bookmarks to the selected category
            if (!bookmarks[selectedCategory]) {
                bookmarks[selectedCategory] = [];
            }

            newBookmarks.forEach(bookmark => {
                const bookmarkId = Date.now() + Math.random(); // Ensure unique ID
                bookmarks[selectedCategory].push({
                    id: bookmarkId,
                    title: bookmark.title,
                    url: bookmark.url,
                    description: bookmark.description || '' // Empty description if none found
                });
            });

            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
            importPopup.style.display = 'none';
            renderBookmarks(); // Refresh display
        };

        reader.readAsText(file);
    });
    //Add actions to new Button
    addCustomCategoryBtn.addEventListener('click', () => {

        const customCategory = prompt('Enter a new category name:');

        if (customCategory) {
            if (!allCategories.includes(customCategory)) {
                allCategories.push(customCategory) // Push to global categories
                saveCategories() //Save
                populateCategorySelect() // Popuplate Again
            }
        }
        renderBookmarks() //To fix Add
    })
    addBookmarkBtn.addEventListener('click', () => {
        addBookmarkPopup.style.display = 'block';
        populateCategorySelect(); // Refresh categories in popup
    });
    importBookmarksBtn.addEventListener('click', () => {
        importPopup.style.display = 'block';
        populateCategorySelect(); // Refresh categories in popup
    });
    importCloseButton.addEventListener('click', () => {
        importPopup.style.display = 'none';
    });

    closeButton.addEventListener('click', () => {
        addBookmarkPopup.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === addBookmarkPopup) {
            addBookmarkPopup.style.display = 'none';
        }
        if (event.target === importPopup) {
            importPopup.style.display = 'none';
        }
    });
  // All Event on submit button in popup to add or Edit Item
    bookmarkForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const category = document.getElementById('category').value;
        const title = document.getElementById('title').value;
        const url = document.getElementById('url').value;
        const description = document.getElementById('description').value;

        if (bookmarkToEdit) {
            // Find the bookmark in the correct category
            if (bookmarks[bookmarkToEdit.category] !== undefined) {
            const bookmarkIndex = bookmarks[bookmarkToEdit.category].findIndex(b => b.id === parseInt(bookmarkToEdit.bookmarkId));

              if (bookmarkIndex !== -1) {
                // Update bookmark properties
                bookmarks[bookmarkToEdit.category][bookmarkIndex].title = title;
                bookmarks[bookmarkToEdit.category][bookmarkIndex].url = url;
                bookmarks[bookmarkToEdit.category][bookmarkIndex].description = description;
                  // Store updated bookmarks in local storage
                   localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
                // Reset the button disabled value
                  document.getElementById('category').removeAttribute("disabled") //Make them Editable

                 }
              }

        } else {
             const bookmarkId = Date.now();
             if (!bookmarks[category]) {
                bookmarks[category] = [];
             }
                bookmarks[category].push({
                     id: bookmarkId,
                     title: title,
                     url: url,
                     description: description
                });

        }
// Store updated bookmarks in local storage
         localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
        // Remove
            bookmarkToEdit = null;
        document.getElementById('category').removeAttribute("disabled") //Make them Editable
        addBookmarkPopup.style.display = 'none';

        bookmarkForm.reset();
        renderBookmarks(searchInput.value) //Refresh the current List with search value

        });

    // Show dinamic a popup for the actions with categories and bookmarks
    function showConfirmationPopup(action, category = null, bookmarkId = null) { // Show dinamic a popup
        confirmationPopup.innerHTML = ''; // Clear previous content
        const popupContent = document.createElement('div');
        popupContent.classList.add('popup-content');
        let message = '';
        if (action === 'removeBookmark') {
            message = 'Are you sure you want to remove this bookmark?';
        } else if (action === 'removeCategory') {
            message = 'Are you sure you want to remove this category and all its bookmarks?';
        }
        popupContent.innerHTML = `<p>${message}</p>`;

        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirm';
        confirmButton.addEventListener('click', () => {
            if (action === 'removeBookmark') {
               removeBookmark() // Remove the bookmark now with global const
            } else if (action === 'removeCategory') {
              removeCategory()
            }
        });

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Cancel';
        cancelButton.addEventListener('click', () => {
            confirmationPopup.style.display = 'none';
             // Clear pending actions
             bookmarkToRemove = null;
             categoryToRemove = null;
        });

        popupContent.appendChild(confirmButton);
        popupContent.appendChild(cancelButton);
        confirmationPopup.appendChild(popupContent);

        confirmationPopup.style.display = 'block';
    }

    // All actions for Edit bookmark
    function editBookmark(category, bookmarkId) {
        bookmarkToEdit = {
            category: category,
            bookmarkId: bookmarkId
        };
        // Open the add bookmark popup in "edit" mode
        addBookmarkPopup.style.display = 'block';
        populateCategorySelect(); // Refresh categories in popup

        const bookmark = bookmarks[category].find(bookmark => bookmark.id === bookmarkId);

        document.getElementById('category').value = category; //Set preselected value, Can´t Change so disable that
        document.getElementById('title').value = bookmark.title; // Fill inputs value for change it
        document.getElementById('url').value = bookmark.url;
        document.getElementById('description').value = bookmark.description;

        document.getElementById('category').setAttribute("disabled", "true") //Make them readonly
//  To not carry value to the Popup  after Edit
        processBookmarkFileBtn.value = "";

    }
    // Remove or delete bookmark
    function removeBookmark() {

        // Check that it exist
        if (bookmarkToRemove) {
            bookmarks[bookmarkToRemove.category] = bookmarks[bookmarkToRemove.category].filter(bookmark => bookmark.id !== bookmarkToRemove.bookmarkId);
            if (bookmarks[bookmarkToRemove.category].length === 0) {
                delete bookmarks[bookmarkToRemove.category]; // Remove empty category
            }
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
            renderBookmarks();
            bookmarkToRemove = null;
            confirmationPopup.style.display = 'none';
        }

    }
    //Remove catagres now fixed
    function removeCategory() {
           allCategories = allCategories.filter(cat => cat !== categoryToRemove.category);
            saveCategories();

            delete bookmarks[categoryToRemove.category]; //Remove from bookmark
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
           renderBookmarks()
           categoryToRemove = null;
            populateCategorySelect();

       confirmationPopup.style.display = 'none';
     }
   // Function with popup before remove Category
    function confirmRemoveCategory(category) {
        categoryToRemove = {
            category: category
        };
        showConfirmationPopup('removeCategory');
    }
    //Show Categories in HTLM for each element inside
    function renderBookmarks(searchTerm = '') {
        bookmarkContainer.innerHTML = '';
        bookmarkContainer.appendChild(confirmationPopup) // Append dinamic to see

        allCategories.forEach(category => {
            const categoryBookmarks = bookmarks[category] || [];

            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('bookmark-category');

            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = category;

            // Add bookmark Category
            const addBookmarkCategoryButton = document.createElement('button');
            addBookmarkCategoryButton.classList.add('add-bookmark-category');
            addBookmarkCategoryButton.textContent = '+ Add';

            const removeCategoryButton = document.createElement('button');
            removeCategoryButton.classList.add('remove-category');
            removeCategoryButton.textContent = 'Remove';

            // Add bookmark Container
            const categoryButtons = document.createElement('div');
            categoryButtons.classList.add('category-buttons');
            categoryButtons.appendChild(addBookmarkCategoryButton)
            categoryButtons.appendChild(removeCategoryButton)

            categoryTitle.appendChild(categoryButtons);
            addBookmarkCategoryButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent click from triggering category click
                // Open the add bookmark popup with the category pre-selected
                addBookmarkPopup.style.display = 'block';
                categorySelect.value = category; // Set preselected value
                 processBookmarkFileBtn.value = ""; //Set value from file to be able to search new data for edit
            });
            removeCategoryButton.addEventListener('click', (event) => {
                event.stopPropagation();
                //removeCategory(category);
                confirmRemoveCategory(category)
            });

            categoryDiv.appendChild(categoryTitle);

            // Create a Container For Squares
            const bookmarkCardContainer = document.createElement('div');
            bookmarkCardContainer.classList.add('bookmark-card-container');

            categoryBookmarks.forEach(bookmark => {
                const card = document.createElement('div');
                //Check for search value to not be null
                if (searchTerm) {
                    //Now search for inside of the card if exist
                    if (bookmark.title.toLowerCase().includes(searchTerm.toLowerCase())) { //If have the value show it
                        card.classList.add('bookmark-card');
                        card.innerHTML = `
                   <a href="${bookmark.url}" target="_blank">${bookmark.title}</a>
                `;
                        const removeButton = document.createElement('button');
                        removeButton.classList.add('remove-bookmark');
                        removeButton.textContent = 'X';

                        const editButton = document.createElement('button');
                        editButton.classList.add('edit-bookmark');
                        editButton.textContent = 'Edit';

                        const bookmarkButtons = document.createElement('div'); //Div Container for Buttons
                        bookmarkButtons.classList.add('bookmark-buttons');
                        bookmarkButtons.appendChild(editButton)
                        bookmarkButtons.appendChild(removeButton); //Put all togheter
                        card.appendChild(bookmarkButtons) //Put on Card

                        removeButton.addEventListener('click', (event) => {
                            event.stopPropagation(); // Prevent click from opening the link
                            //removeBookmark(category, bookmark.id);
                            bookmarkToRemove = {
                                category: category,
                                bookmarkId: bookmark.id
                            };
                            showConfirmationPopup('removeBookmark');
                        });
                        editButton.addEventListener('click', (event) => {
                            event.stopPropagation(); // Prevent click from opening the link

                            editBookmark(category, bookmark.id)
                        });
                        bookmarkCardContainer.appendChild(card);
                    }

                } else { //If have no search value show the card
                    card.classList.add('bookmark-card');
                    card.innerHTML = `
                   <a href="${bookmark.url}" target="_blank">${bookmark.title}</a>
                `;
                    const removeButton = document.createElement('button');
                    removeButton.classList.add('remove-bookmark');
                    removeButton.textContent = 'X';

                    const editButton = document.createElement('button');
                    editButton.classList.add('edit-bookmark');
                    editButton.textContent = 'Edit';

                    const bookmarkButtons = document.createElement('div'); //Div Container for Buttons
                    bookmarkButtons.classList.add('bookmark-buttons');
                    bookmarkButtons.appendChild(editButton)
                    bookmarkButtons.appendChild(removeButton); //Put all togheter
                    card.appendChild(bookmarkButtons) //Put on Card

                    removeButton.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent click from opening the link
                        bookmarkToRemove = {
                            category: category,
                            bookmarkId: bookmark.id
                        };
                        showConfirmationPopup('removeBookmark');
                    });
                    editButton.addEventListener('click', (event) => {
                        event.stopPropagation(); // Prevent click from opening the link

                        editBookmark(category, bookmark.id)
                    });
                    bookmarkCardContainer.appendChild(card);
                }
            });
            categoryDiv.appendChild(bookmarkCardContainer)
            bookmarkContainer.appendChild(categoryDiv);
        });

    }

    //Add actions to new Button
    addCustomCategoryBtn.addEventListener('click', () => {

        const customCategory = prompt('Enter a new category name:');

        if (customCategory) {
            if (!allCategories.includes(customCategory)) {
                allCategories.push(customCategory) // Push to global categories
                saveCategories() //Save
                populateCategorySelect() // Popuplate Again
            }
        }
        renderBookmarks() //To fix Add
    })
    addBookmarkBtn.addEventListener('click', () => {
        addBookmarkPopup.style.display = 'block';
        populateCategorySelect(); // Refresh categories in popup
        processBookmarkFileBtn.value = ""; //To fix edit Bookmark

    });
    importBookmarksBtn.addEventListener('click', () => {
        importPopup.style.display = 'block';
        populateCategorySelect(); // Refresh categories in popup
        processBookmarkFileBtn.value = ""; //To fix edit Bookmark

    });
    importCloseButton.addEventListener('click', () => {
        importPopup.style.display = 'none';
    });

    closeButton.addEventListener('click', () => {
        addBookmarkPopup.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === addBookmarkPopup) {
            addBookmarkPopup.style.display = 'none';
             processBookmarkFileBtn.value = ""; //To fix edit Bookmark

        }
        if (event.target === importPopup) {
            importPopup.style.display = 'none';

        }
    });

    function extractBookmarksFromHTML(htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const aTags = doc.querySelectorAll('a'); // Assuming bookmarks are in <a> tags

        const bookmarks = [];
        aTags.forEach(aTag => {
            const href = aTag.getAttribute('href');
            const title = aTag.textContent;

            if (href) {
                bookmarks.push({
                    title: title,
                    url: href
                });
            }
        });

        return bookmarks;
    }
    // Init func to show all and create function
    function saveCategories() {
        localStorage.setItem('userCategories', JSON.stringify(allCategories.filter(cat => !defaultCategories.includes(cat))));
    }

    function populateCategorySelect() {
        categorySelect.innerHTML = '';
        importCategorySelect.innerHTML = ''; // Also re-render in import categories

        // Add existing categories
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
            importCategorySelect.appendChild(option.cloneNode(true)); // Add option to import category select too
        });

    }
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        renderBookmarks(searchTerm); //To fix Add

    });
    // Init function to render the categories to the localStorage
    renderBookmarks()

    populateCategorySelect()

    processBookmarkFileBtn.value = ""; //To fix edit Bookmark
    saveCategories()

});