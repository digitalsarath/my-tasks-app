    // Import necessary functions from Firebase SDKs for authentication and database
        import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
        import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
        import { getAuth, onAuthStateChanged, GoogleAuthProvider, GithubAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
        import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, serverTimestamp, writeBatch, where, getDocs } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

    // This event listener ensures that the entire script runs only after the
    // HTML document has been fully loaded and parsed. This prevents "race condition"
    // errors where the script tries to access DOM elements or external libraries (like Lucide)
    // before they are ready.
        window.addEventListener('DOMContentLoaded', () => {

    // --- SECTION: Configuration and Initialization ---
            
    // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyA2l3M9vEoFdkV2pylaIsjvnO8QJd2AQLY",
            authDomain: "my-tasks-app-efe31.firebaseapp.com",
            projectId: "my-tasks-app-efe31",
            storageBucket: "my-tasks-app-efe31.firebasestorage.app",
            messagingSenderId: "723239854375",
            appId: "1:723239854375:web:cd6177a95807b5f34e0902",
            measurementId: "G-W79S3ZCP0Y"
        };

        const appId = 'my-tasks-app';

    // Initialize Firebase services
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            const googleProvider = new GoogleAuthProvider();
            const githubProvider = new GithubAuthProvider();
            // Initialize Google Analytics (optional)
            const analytics = getAnalytics(app);

            // --- SECTION: Constants and State Management ---

            // Define the possible statuses for a task
            const STATUSES = { TODO: 'To Do', IN_PROGRESS: 'In Progress', COMPLETED: 'Completed' };

            // A curated list of Lucide icon names for the folder icon picker
            const ICON_NAMES = [
                'folder-closed', 'briefcase', 'code-2', 'home', 'book-open', 'star', 'heart', 
                'flag', 'plane', 'graduation-cap', 'lightbulb', 'shopping-cart', 'dollar-sign', 
                'bar-chart-2', 'pen-square', 'camera', 'music', 'globe', 'wrench', 'users'
            ];

            // Central object to hold references to all key DOM elements for easy access
            const elements = {
                appContainer: document.getElementById('app-container'),
                mainApp: document.getElementById('main-app'),
                headerTitle: document.getElementById('header-title'),
                welcomeMessage: document.getElementById('welcome-message'),
                progressBar: document.getElementById('progress-bar'),
                progressText: document.getElementById('progress-text'),
                emptyState: document.getElementById('empty-state'),
                emptyStateTitle: document.getElementById('empty-state-title'),
                emptyStateMessage: document.getElementById('empty-state-message'),
                sidebar: document.getElementById('sidebar'),
                sidebarHeader: document.getElementById('sidebar-header'),
                burgerMenuButton: document.getElementById('burger-menu-button'),
                signInPromptButton: document.getElementById('signin-prompt-button'),
                signOutButton: document.getElementById('signout-button'),
                mainActionButtons: document.getElementById('main-action-buttons'),
                projectSummarySection: document.getElementById('project-summary-section'),
                projectSummaryText: document.getElementById('project-summary-text'),
                todoList: document.getElementById('todo-list'),
                inprogressList: document.getElementById('inprogress-list'),
                completedList: document.getElementById('completed-list'),
                todoColumn: document.getElementById('todo-column'),
                inprogressColumn: document.getElementById('inprogress-column'),
                completedColumn: document.getElementById('completed-column'),
                loginModal: document.getElementById('login-modal'),
                closeLoginModalButton: document.getElementById('close-login-modal-button'),
                loginErrorMessage: document.getElementById('login-error-message'),
                googleSignInButton: document.getElementById('google-signin-button'),
                githubSignInButton: document.getElementById('github-signin-button'),
                taskDetailsModal: document.getElementById('task-details-modal'),
                taskDetailsForm: document.getElementById('task-details-form'),
                modalTitle: document.getElementById('modal-title'),
                taskIdInput: document.getElementById('task-id-input'),
                taskTitleInput: document.getElementById('task-title-input'),
                taskFolderSelect: document.getElementById('task-folder-select'),
                taskDescriptionInput: document.getElementById('task-description-input'),
                generateDescriptionButton: document.getElementById('generate-description-button'),
                descriptionSpinner: document.getElementById('description-spinner'),
                taskStartDateInput: document.getElementById('task-start-date-input'),
                taskEndDateInput: document.getElementById('task-end-date-input'),
                cancelTaskButton: document.getElementById('cancel-task-button'),
                saveTaskButton: document.getElementById('save-task-button'),
                openAddTaskModalButton: document.getElementById('open-add-task-modal-button'),
                folderList: document.getElementById('folder-list'),
                folderModal: document.getElementById('folder-modal'),
                folderForm: document.getElementById('folder-form'),
                folderModalTitle: document.getElementById('folder-modal-title'),
                folderIdInput: document.getElementById('folder-id-input'),
                folderNameInput: document.getElementById('folder-name-input'),
                iconPicker: document.getElementById('icon-picker'),
                openAddFolderModalButton: document.getElementById('open-add-folder-modal-button'),
                cancelFolderButton: document.getElementById('cancel-folder-button'),
                saveFolderButton: document.getElementById('save-folder-button'),
                aiSuggesterModal: document.getElementById('ai-suggester-modal'),
                openAiSuggesterButton: document.getElementById('open-ai-suggester-button'),
                closeAiModalButton: document.getElementById('close-ai-modal-button'),
                aiGoalInput: document.getElementById('ai-goal-input'),
                generateSuggestionsButton: document.getElementById('generate-suggestions-button'),
                aiSuggestionsList: document.getElementById('ai-suggestions-list'),
                aiLoadingSpinner: document.getElementById('ai-loading-spinner'),
                aiErrorMessage: document.getElementById('ai-error-message'),
                // Trash elements
                trashViewButton: document.getElementById('trash-view-button'),
                trashView: document.getElementById('trash-view'),
                trashedFoldersList: document.getElementById('trashed-folders-list'),
                trashedTasksList: document.getElementById('trashed-tasks-list'),
                emptyTrashState: document.getElementById('empty-trash-state'),
                // Delete confirmation modal
                deleteConfirmationModal: document.getElementById('delete-confirmation-modal'),
                deleteModalTitle: document.getElementById('delete-modal-title'),
                deleteModalText: document.getElementById('delete-modal-text'),
                cancelDeleteButton: document.getElementById('cancel-delete-button'),
                trashItemButton: document.getElementById('trash-item-button'),
                deletePermanentlyButton: document.getElementById('delete-permanently-button'),
            };

            // --- Global State Variables ---
            let allTasks = []; // Holds all tasks for the current user/session
            let allFolders = []; // Holds all folders
            let unsubscribeTasks = null; // Function to stop listening for Firestore task updates
            let unsubscribeFolders = null; // Function to stop listening for Firestore folder updates
            let selectedFolderId = 'all'; // The currently active folder ID ('all' or 'trash' are special)
            let selectedIcon = 'folder-closed'; // The icon chosen in the folder modal
            let itemToDelete = { id: null, type: null }; // Holds info for the item in the delete confirmation modal

            // Keys for storing data in the browser's local storage for guest users
            const LOCAL_STORAGE_KEYS = {
                TASKS: 'personal-task-manager-tasks',
                FOLDERS: 'personal-task-manager-folders',
            };

            // --- SECTION: Data Persistence (Local Storage for Guests) ---

            /**
             * Saves data to local storage.
             * @param {string} key The key to save under.
             * @param {any} data The data to save (will be JSON stringified).
             */
            function saveLocalData(key, data) {
                try { localStorage.setItem(key, JSON.stringify(data)); } 
                catch (error) { console.error(`Could not save to local storage (${key}):`, error); }
            }

            /**
             * Loads data from local storage.
             * @param {string} key The key to load from.
             * @returns {any[]} The parsed data, or an empty array if not found or on error.
             */
            function loadLocalData(key) {
                try {
                    const storedData = localStorage.getItem(key);
                    return storedData ? JSON.parse(storedData) : [];
                } catch (error) {
                    console.error(`Could not load from local storage (${key}):`, error);
                    return [];
                }
            }

            // --- SECTION: Authentication Management ---

            /**
             * Firebase auth state listener. Triggers whenever the user's login state changes.
             */
            onAuthStateChanged(auth, user => {
                if (user) {
                    // User is signed in
                    handleUserLoggedIn(user);
                } else {
                    // User is signed out or a guest
                    handleUserLoggedOut();
                }
            });

            /**
             * Handles the logic for a signed-in user.
             * @param {object} user The Firebase user object.
             */
            async function handleUserLoggedIn(user) {
                // Update UI to reflect logged-in state
                elements.signInPromptButton.classList.add('hidden');
                elements.signOutButton.classList.remove('hidden');
                elements.welcomeMessage.textContent = `Welcome, ${user.displayName || 'User'}!`;
                
                // Check for any local data that needs to be moved to Firestore
                const localTasksToMigrate = loadLocalData(LOCAL_STORAGE_KEYS.TASKS);
                const localFoldersToMigrate = loadLocalData(LOCAL_STORAGE_KEYS.FOLDERS);

                if (localFoldersToMigrate.length > 0 || localTasksToMigrate.length > 0) {
                     await migrateLocalDataToFirestore(user.uid, localFoldersToMigrate, localTasksToMigrate);
                }

                // Start listening for real-time updates from Firestore
                listenForFolders(user.uid);
                listenForTasks(user.uid);
            }

            /**
             * Handles the logic for a signed-out (guest) user.
             */
            function handleUserLoggedOut() {
                // Update UI to reflect guest state
                elements.signInPromptButton.classList.remove('hidden');
                elements.signOutButton.classList.add('hidden');
                elements.welcomeMessage.textContent = 'Log in to sync across devices.';
                
                // Stop listening to Firestore updates
                if (unsubscribeTasks) unsubscribeTasks();
                if (unsubscribeFolders) unsubscribeFolders();

                // Load data from local storage instead
                allFolders = loadLocalData(LOCAL_STORAGE_KEYS.FOLDERS);
                allTasks = loadLocalData(LOCAL_STORAGE_KEYS.TASKS);
                renderAll();
            }

            /**
             * Migrates data from local storage to Firestore after a user signs in for the first time.
             * @param {string} userId The user's unique ID.
             * @param {object[]} folders The array of folders from local storage.
             * @param {object[]} tasks The array of tasks from local storage.
             */
            async function migrateLocalDataToFirestore(userId, folders, tasks) {
                const folderIdMap = {}; // Maps old local IDs to new Firestore IDs
                const folderCollectionPath = `/artifacts/${appId}/users/${userId}/folders`;
                const folderBatch = writeBatch(db); // Use a batch write for efficiency

                // Create new documents for each folder in Firestore
                folders.forEach(folder => {
                    const newDocRef = doc(collection(db, folderCollectionPath));
                    folderIdMap[folder.id] = newDocRef.id;
                    const { id, ...folderData } = folder; // Exclude the old local ID
                    folderBatch.set(newDocRef, { ...folderData, createdAt: serverTimestamp() });
                });
                await folderBatch.commit();
                
                // Do the same for tasks, updating folder IDs to the new Firestore IDs
                const taskCollectionPath = `/artifacts/${appId}/users/${userId}/tasks`;
                const taskBatch = writeBatch(db);
                tasks.forEach(task => {
                    const { id, ...taskData } = task;
                    if (task.folderId && folderIdMap[task.folderId]) {
                        taskData.folderId = folderIdMap[task.folderId]; // Update to new folder ID
                    }
                    const docRef = doc(collection(db, taskCollectionPath));
                    taskBatch.set(docRef, { ...taskData, createdAt: serverTimestamp() });
                });
                await taskBatch.commit();

                // Clear the local storage now that data is safely in Firestore
                localStorage.removeItem(LOCAL_STORAGE_KEYS.TASKS);
                localStorage.removeItem(LOCAL_STORAGE_KEYS.FOLDERS);
            }

            /**
             * Initiates the sign-in process using a Firebase provider (Google or GitHub).
             * @param {object} provider The Firebase auth provider.
             */
            const signIn = async (provider) => {
                elements.loginErrorMessage.classList.add('hidden');
                try {
                    await signInWithPopup(auth, provider);
                    closeLoginModal();
                } catch (error) {
                    console.error("Error signing in:", error.code, error.message);
                    elements.loginErrorMessage.textContent = `An error occurred. Please try again. (${error.code})`;
                    elements.loginErrorMessage.classList.remove('hidden');
                }
            };

            // --- SECTION: Folder Management ---

            /**
             * Sets up a real-time listener for folder data from Firestore.
             * @param {string} userId The current user's ID.
             */
            function listenForFolders(userId) {
                if (unsubscribeFolders) unsubscribeFolders(); // Unsubscribe from previous listener
                const foldersCollectionPath = `/artifacts/${appId}/users/${userId}/folders`;
                const q = query(collection(db, foldersCollectionPath));
                unsubscribeFolders = onSnapshot(q, snapshot => {
                    allFolders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    renderAll(); // Re-render the UI with the new data
                });
            }

            /**
             * Saves a folder (creates a new one or updates an existing one).
             * @param {object} folderData The folder object to save.
             */
            async function saveFolder(folderData) {
                const user = auth.currentUser;
                const folderId = folderData.id;

                if (!folderData.name) { alert("Folder name is required."); return; }

                if (user) {
                    // If user is logged in, save to Firestore
                    const collectionPath = `/artifacts/${appId}/users/${user.uid}/folders`;
                    if (folderId && !folderId.startsWith('local_')) {
                        // Update existing folder
                        const folderRef = doc(db, collectionPath, folderId);
                        await updateDoc(folderRef, { name: folderData.name, icon: folderData.icon });
                    } else {
                        // Create new folder
                        await addDoc(collection(db, collectionPath), { name: folderData.name, icon: folderData.icon, createdAt: serverTimestamp(), isTrashed: false });
                    }
                } else {
                    // If user is a guest, save to local storage
                    if (folderId) {
                        const folderIndex = allFolders.findIndex(f => f.id === folderId);
                        if (folderIndex > -1) allFolders[folderIndex] = { ...allFolders[folderIndex], ...folderData };
                    } else {
                        allFolders.push({ ...folderData, id: `local_${Date.now()}`, isTrashed: false});
                    }
                    saveLocalData(LOCAL_STORAGE_KEYS.FOLDERS, allFolders);
                    renderAll();
                }
                closeFolderModal();
            }

            // --- SECTION: Task Management ---

            /**
             * Sets up a real-time listener for task data from Firestore.
             * @param {string} userId The current user's ID.
             */
            function listenForTasks(userId) {
                if (unsubscribeTasks) unsubscribeTasks();
                const tasksCollectionPath = `/artifacts/${appId}/users/${userId}/tasks`;
                const q = query(collection(db, tasksCollectionPath));
                unsubscribeTasks = onSnapshot(q, (querySnapshot) => {
                    allTasks = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    renderAll();
                });
            }

            /**
             * Saves a task (creates a new one or updates an existing one).
             * @param {object} taskData The task object to save.
             */
            async function saveTask(taskData) {
                const user = auth.currentUser;
                const taskId = taskData.id;

                if (!taskData.title) { alert("Task title is required."); return; }

                // Assign order if not present (new task)
                if (!taskId) {
                    // Find max order in the target status column
                    const tasksInStatus = allTasks.filter(
                        t => t.status === (taskData.status || STATUSES.TODO) && !t.isTrashed
                    );
                    const maxOrder = tasksInStatus.length > 0 ? Math.max(...tasksInStatus.map(t => t.order ?? 0)) : -1;
                    taskData.order = maxOrder + 1;
                }

                if (user) {
                    taskData.updatedAt = serverTimestamp();
                    const collectionPath = `/artifacts/${appId}/users/${user.uid}/tasks`;
                    try {
                        if (taskId && !taskId.startsWith('local_')) {
                            const taskRef = doc(db, collectionPath, taskId);
                            await updateDoc(taskRef, taskData);
                        } else {
                            taskData.status = STATUSES.TODO;
                            taskData.createdAt = serverTimestamp();
                            taskData.isTrashed = false;
                            await addDoc(collection(db, collectionPath), taskData);
                        }
                    } catch (error) {
                        console.error("Error saving task to Firestore:", error);
                    }
                } else {
                    if (taskId) {
                        const taskIndex = allTasks.findIndex(t => t.id === taskId);
                        if (taskIndex > -1) allTasks[taskIndex] = { ...allTasks[taskIndex], ...taskData };
                    } else {
                        allTasks.push({ ...taskData, id: `local_${Date.now()}`, status: STATUSES.TODO, isTrashed: false, order: taskData.order });
                    }
                    saveLocalData(LOCAL_STORAGE_KEYS.TASKS, allTasks);
                    renderAll();
                }
                 closeTaskModal();
            }

            /**
             * Handles the form submission for creating/editing a task.
             * @param {Event} e The form submission event.
             */
            function handleTaskFormSubmit(e) {
                e.preventDefault();
                const taskData = {
                    id: elements.taskIdInput.value,
                    title: elements.taskTitleInput.value.trim(),
                    description: elements.taskDescriptionInput.value.trim(),
                    folderId: elements.taskFolderSelect.value,
                    startDate: elements.taskStartDateInput.value,
                    endDate: elements.taskEndDateInput.value,
                };
                saveTask(taskData);
            }

            /**
             * Updates the status of a task (e.g., from 'To Do' to 'In Progress').
             * @param {string} taskId The ID of the task to update.
             * @param {string} newStatus The new status.
             */
            async function updateTaskStatus(taskId, newStatus) {
                const user = auth.currentUser;
                const isCompleting = newStatus === STATUSES.COMPLETED;
                
                if (user) {
                    const taskRef = doc(db, `/artifacts/${appId}/users/${user.uid}/tasks`, taskId);
                    try { 
                        await updateDoc(taskRef, { status: newStatus }); 
                        if(isCompleting) triggerConfetti(); // Celebration!
                    }
                    catch (error) { console.error("Error updating task status:", error); }
                } else {
                    const taskIndex = allTasks.findIndex(t => t.id === taskId);
                    if (taskIndex > -1) {
                        // Ensure status is set exactly as defined in STATUSES
                        allTasks[taskIndex].status = newStatus;
                        saveLocalData(LOCAL_STORAGE_KEYS.TASKS, allTasks);
                        renderAll();
                        if(isCompleting) triggerConfetti();
                    }
                }
            }

            // --- SECTION: Trash and Deletion Logic ---

            /**
             * Opens the confirmation modal for deleting an item.
             * @param {string} id The ID of the item.
             * @param {string} type The type of item ('folder' or 'task').
             */
            function openDeleteConfirmationModal(id, type) {
                itemToDelete = { id, type };
                elements.deleteModalTitle.textContent = `Delete ${type}`;
                elements.deleteModalText.textContent = `Are you sure you want to delete this ${type}? You can move it to the trash or delete it permanently.`;
                elements.deleteConfirmationModal.classList.remove('hidden');
            }

            /**
             * Closes the delete confirmation modal.
             */
            function closeDeleteConfirmationModal() {
                elements.deleteConfirmationModal.classList.add('hidden');
                itemToDelete = { id: null, type: null };
            }

            /**
             * Moves an item to the trash by setting its 'isTrashed' flag to true.
             */
            async function moveItemToTrash() {
                const { id, type } = itemToDelete;
                const user = auth.currentUser;

                if (user) {
                    const collectionName = type === 'folder' ? 'folders' : 'tasks';
                    const itemRef = doc(db, `/artifacts/${appId}/users/${user.uid}/${collectionName}`, id);
                    await updateDoc(itemRef, { isTrashed: true });
                } else {
                    const collection = type === 'folder' ? allFolders : allTasks;
                    const itemIndex = collection.findIndex(item => item.id === id);
                    if (itemIndex > -1) collection[itemIndex].isTrashed = true;
                    const storageKey = type === 'folder' ? LOCAL_STORAGE_KEYS.FOLDERS : LOCAL_STORAGE_KEYS.TASKS;
                    saveLocalData(storageKey, collection);
                    renderAll();
                }
                closeDeleteConfirmationModal();
            }

            /**
             * Permanently deletes an item from the database or local storage.
             */
            async function deleteItemPermanently() {
                const { id, type } = itemToDelete;
                const user = auth.currentUser;
                
                if (user) {
                    if (type === 'folder') {
                        // Deleting a folder also deletes all tasks within it
                        await deleteFolderPermanently(id);
                    } else {
                        await deleteTaskPermanently(id);
                    }
                } else {
                    // Handle deletion for guest users from local storage
                    if (type === 'folder') {
                        allFolders = allFolders.filter(f => f.id !== id);
                        allTasks = allTasks.filter(t => t.folderId !== id); // Also delete associated tasks
                        saveLocalData(LOCAL_STORAGE_KEYS.FOLDERS, allFolders);
                        saveLocalData(LOCAL_STORAGE_KEYS.TASKS, allTasks);
                    } else {
                        allTasks = allTasks.filter(t => t.id !== id);
                        saveLocalData(LOCAL_STORAGE_KEYS.TASKS, allTasks);
                    }
                    renderAll();
                }
                closeDeleteConfirmationModal();
            }

            /**
             * Handles the permanent deletion of a folder and its contents from Firestore.
             * @param {string} folderId The ID of the folder to delete.
             */
            async function deleteFolderPermanently(folderId) {
                 const user = auth.currentUser;
                 if (!user) return;
                 try {
                    const batch = writeBatch(db);
                    // 1. Delete the folder document itself
                    const folderRef = doc(db, `/artifacts/${appId}/users/${user.uid}/folders`, folderId);
                    batch.delete(folderRef);
                    // 2. Find and delete all tasks within that folder
                    const tasksQuery = query(collection(db, `/artifacts/${appId}/users/${user.uid}/tasks`), where("folderId", "==", folderId));
                    const tasksSnapshot = await getDocs(tasksQuery);
                    tasksSnapshot.forEach(doc => batch.delete(doc.ref));
                    // 3. Commit the batch operation
                    await batch.commit();
                    if (selectedFolderId === folderId) selectedFolderId = 'all'; // Reset view if active folder was deleted
                 } catch (error) {
                     console.error("Error permanently deleting folder:", error);
                 }
            }

            /**
             * Handles the permanent deletion of a single task from Firestore.
             * @param {string} taskId The ID of the task to delete.
             */
            async function deleteTaskPermanently(taskId) {
                const user = auth.currentUser;
                if (!user) return;
                const taskRef = doc(db, `/artifacts/${appId}/users/${user.uid}/tasks`, taskId);
                await deleteDoc(taskRef);
            }

            /**
             * Restores an item from the trash by setting its 'isTrashed' flag to false.
             * @param {string} id The ID of the item.
             * @param {string} type The type of item ('folder' or 'task').
             */
            async function restoreItem(id, type) {
                const user = auth.currentUser;
                if (user) {
                    const collectionName = type === 'folder' ? 'folders' : 'tasks';
                    const itemRef = doc(db, `/artifacts/${appId}/users/${user.uid}/${collectionName}`, id);
                    await updateDoc(itemRef, { isTrashed: false });
                } else {
                    const collection = type === 'folder' ? allFolders : allTasks;
                    const itemIndex = collection.findIndex(item => item.id === id);
                    if (itemIndex > -1) collection[itemIndex].isTrashed = false;
                    const storageKey = type === 'folder' ? LOCAL_STORAGE_KEYS.FOLDERS : LOCAL_STORAGE_KEYS.TASKS;
                    saveLocalData(storageKey, collection);
                    renderAll();
                }
            }

            // --- SECTION: UI Rendering ---

            /**
             * The main render function that decides which view to show.
             */
            function renderAll() {
                if (selectedFolderId === 'trash') {
                    renderTrashView();
                } else {
                    renderMainView();
                }
                 // Re-initialize Lucide icons after any DOM update
                 lucide.createIcons();
            }

            /**
             * Renders the main application view (task board).
             */
            function renderMainView() {
                elements.mainApp.classList.remove('hidden');
                elements.trashView.classList.add('hidden');
                updateHeader();
                renderFolders();
                renderTasks();
                updateProgress();
                updateTaskFolderSelect();
                updateActionButtons();
            }

            /**
             * Renders the list of folders in the sidebar.
             */
            function renderFolders() {
                // Start with the static "All Tasks" link
                elements.folderList.innerHTML = `
                    <li>
                        <a href="#" class="folder-item group flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${selectedFolderId === 'all' ? 'active' : 'hover:bg-slate-100'}" data-folder-id="all" title="All Tasks">
                            <span class="flex items-center gap-3">
                               <i data-lucide="layout-grid" class="w-5 h-5"></i>
                                <span class="sidebar-text">All Tasks</span>
                            </span>
                        </a>
                    </li>
                `;
                // Get active (not trashed) folders and sort them alphabetically
                const activeFolders = allFolders.filter(f => !f.isTrashed).sort((a, b) => a.name.localeCompare(b.name));

                // Create and append an element for each folder
                activeFolders.forEach(folder => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <a href="#" class="folder-item group flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${selectedFolderId === folder.id ? 'active' : 'hover:bg-slate-100'}" data-folder-id="${folder.id}" title="${folder.name}">
                            <span class="flex items-center gap-3 truncate">
                                <i data-lucide="${folder.icon || 'folder-closed'}" class="w-5 h-5"></i>
                                <span class="flex-1 truncate sidebar-text">${folder.name}</span>
                            </span>
                            <span class="opacity-0 group-hover:opacity-100 transition-opacity sidebar-text">
                                <button class="edit-folder-button p-1 hover:bg-slate-200 rounded-md" data-folder-id="${folder.id}" aria-label="Edit folder">
                                   <i data-lucide="pencil" class="w-4 h-4"></i>
                                </button>
                                <button class="delete-folder-button p-1 hover:bg-slate-200 rounded-md" data-folder-id="${folder.id}" aria-label="Delete folder">
                                   <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </span>
                        </a>`;
                    // Add event listeners for edit and delete buttons
                    li.querySelector('.edit-folder-button').addEventListener('click', (e) => { e.stopPropagation(); openFolderModal(folder); });
                    li.querySelector('.delete-folder-button').addEventListener('click', (e) => { e.stopPropagation(); openDeleteConfirmationModal(folder.id, 'folder'); });
                    elements.folderList.appendChild(li);
                });
                 elements.trashViewButton.classList.toggle('active', selectedFolderId === 'trash');
                 applySidebarState();
            }

            /**
             * Handles clicks on folder items in the sidebar to switch views.
             * @param {Event} e The click event.
             */
            function handleFolderSelect(e) {
                 const folderItem = e.target.closest('.folder-item');
                 if (folderItem) {
                    e.preventDefault();
                    selectedFolderId = folderItem.dataset.folderId;
                    renderAll();
                 }
            }

            /**
             * Renders the tasks on the Kanban board based on the selected folder.
             */
            function renderTasks() {
                elements.todoList.innerHTML = '';
                elements.inprogressList.innerHTML = '';
                elements.completedList.innerHTML = '';
                
                // Filter tasks to show only those that are not trashed and belong to the selected folder
                const activeTasks = allTasks.filter(task => !task.isTrashed);
                const tasksToRender = selectedFolderId === 'all' 
                    ? activeTasks 
                    : activeTasks.filter(task => task.folderId === selectedFolderId);

                // Sort tasks within each status by their 'order' property (default to 0 if missing)
                const sortByOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

                const todoTasks = tasksToRender.filter(t => t.status === STATUSES.TODO).sort(sortByOrder);
                const inprogressTasks = tasksToRender.filter(t => t.status === STATUSES.IN_PROGRESS).sort(sortByOrder);
                const completedTasks = tasksToRender.filter(t => t.status === STATUSES.COMPLETED).sort(sortByOrder);

                // Show or hide the empty state message
                elements.emptyState.classList.toggle('hidden', tasksToRender.length > 0);
                if (tasksToRender.length === 0 && selectedFolderId !== 'all') {
                    elements.emptyStateTitle.textContent = "No tasks here!";
                    elements.emptyStateMessage.textContent = "Add a task to this project to get started.";
                } else if (tasksToRender.length === 0 && selectedFolderId === 'all') {
                    elements.emptyStateTitle.textContent = "You're all clear!";
                    elements.emptyStateMessage.textContent = "Create a project or add a task to get started.";
                }

                todoTasks.forEach(task => elements.todoList.appendChild(createTaskElement(task)));
                inprogressTasks.forEach(task => elements.inprogressList.appendChild(createTaskElement(task)));
                completedTasks.forEach(task => elements.completedList.appendChild(createTaskElement(task)));

                lucide.createIcons();
            }

            /**
             * Creates an HTML element for a single task.
             * @param {object} task The task object.
             * @returns {HTMLElement} The created list item element.
             */
            function createTaskElement(task) {
                const taskItem = document.createElement('li');
                taskItem.className = `task-item-enter bg-white p-4 rounded-lg shadow-sm group cursor-grab`;
                taskItem.dataset.id = task.id;
                taskItem.draggable = true;
                
                // Determine if task is completed or overdue for styling
                const isCompleted = task.status === STATUSES.COMPLETED;
                const endDate = task.endDate ? new Date(task.endDate) : null;
                const isOverdue = endDate && !isCompleted && endDate < new Date();

                taskItem.innerHTML = `
                    <div class="flex justify-between items-start">
                        <p class="font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}">${task.title}</p>
                        <div class="task-actions opacity-0 group-hover:opacity-100 transition-opacity">
                            <button class="edit-button text-slate-500 hover:text-blue-600 p-1 rounded-md" data-task-id="${task.id}" aria-label="Edit task">
                                <i data-lucide="pencil" class="w-4 h-4"></i>
                            </button>
                            <button class="delete-button text-slate-500 hover:text-red-600 p-1 rounded-md" data-task-id="${task.id}" aria-label="Delete task">
                               <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    <p class="text-sm text-slate-600 mt-2 break-words">${task.description || ''}</p>
                    <div class="flex items-center justify-between mt-4 text-xs">
                        <span class="flex items-center gap-1.5 ${isOverdue ? 'text-red-600 font-semibold' : 'text-slate-500'}">
                            <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
                            ${endDate ? endDate.toLocaleDateString() : 'No due date'}
                        </span>
                    </div>
                `;
                
                // Add drag-and-drop event listeners to the task item
                taskItem.addEventListener('dragstart', (e) => { 
                    e.dataTransfer.setData('text/plain', task.id);
                    setTimeout(() => e.target.classList.add('dragging'), 0);
                });
                taskItem.addEventListener('dragend', (e) => e.target.classList.remove('dragging'));
                
                // Add event listeners for the edit and delete buttons
                taskItem.querySelector('.edit-button').addEventListener('click', () => openTaskModal(task));
                taskItem.querySelector('.delete-button').addEventListener('click', () => openDeleteConfirmationModal(task.id, 'task'));
                
                return taskItem;
            }

            /**
             * Sets up the drag-and-drop listeners for the task columns.
             */
            function setupDragAndDropListeners() {
                const columns = [ 
                    { element: elements.todoColumn, status: STATUSES.TODO }, 
                    { element: elements.inprogressColumn, status: STATUSES.IN_PROGRESS }, 
                    { element: elements.completedColumn, status: STATUSES.COMPLETED } 
                ];
                columns.forEach(col => {
                    col.element.addEventListener('dragover', e => { e.preventDefault(); col.element.classList.add('drag-over'); });
                    col.element.addEventListener('dragleave', () => col.element.classList.remove('drag-over'));
                    col.element.addEventListener('drop', e => {
                        e.preventDefault();
                        col.element.classList.remove('drag-over');
                        const taskId = e.dataTransfer.getData('text/plain');
                        updateTaskStatus(taskId, col.status);
                    });
                });
            }

            // --- Drag-and-drop reordering logic for tasks within a status column ---

            function getDragAfterElement(list, y) {
                const draggableElements = [...list.querySelectorAll('.task-item-enter:not(.dragging)')];
                return draggableElements.reduce((closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = y - box.top - box.height / 2;
                    return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
                }, { offset: Number.NEGATIVE_INFINITY }).element;
            }

            function setupReorderListeners() {
                [
                    { list: elements.todoList, status: STATUSES.TODO },
                    { list: elements.inprogressList, status: STATUSES.IN_PROGRESS },
                    { list: elements.completedList, status: STATUSES.COMPLETED }
                ].forEach(({ list, status }) => {
                    list.addEventListener('dragover', function (e) {
                        e.preventDefault();
                        const afterElement = getDragAfterElement(list, e.clientY);
                        const dragging = document.querySelector('.dragging');
                        if (dragging) {
                            if (afterElement == null) {
                                list.appendChild(dragging);
                            } else {
                                list.insertBefore(dragging, afterElement);
                            }
                        }
                    });

                    list.addEventListener('drop', async function (e) {
                        // Get the new order of tasks in this column
                        const ids = [...list.children].map(child => child.dataset.id);
                        // Update order property for each task in this status
                        let changed = false;
                        ids.forEach((id, idx) => {
                            const task = allTasks.find(t => t.id === id);
                            if (task && (task.order !== idx || task.status !== status)) {
                                task.order = idx;
                                task.status = status; // Also allow moving between columns
                                changed = true;
                            }
                        });

                        // Persist changes
                        const user = auth.currentUser;
                        if (changed) {
                            if (user) {
                                // Batch update for Firestore
                                const batch = writeBatch(db);
                                const collectionPath = `/artifacts/${appId}/users/${user.uid}/tasks`;
                                ids.forEach((id, idx) => {
                                    const taskRef = doc(db, collectionPath, id);
                                    batch.update(taskRef, { order: idx, status: status });
                                });
                                await batch.commit();
                            } else {
                                // Local storage
                                saveLocalData(LOCAL_STORAGE_KEYS.TASKS, allTasks);
                            }
                            renderAll();
                        }
                    });
                });
            }

            /**
             * Updates the progress bar based on the tasks in the current view.
             */
            function updateProgress() {
                // In-progress tasks count as 50% complete for a more dynamic progress bar
                const tasksToConsider = selectedFolderId === 'all' 
                    ? allTasks.filter(t => !t.isTrashed)
                    : allTasks.filter(task => !task.isTrashed && task.folderId === selectedFolderId);

                const totalTasks = tasksToConsider.length;
                if (totalTasks === 0) {
                    elements.progressBar.style.width = '0%';
                    elements.progressText.textContent = '0%';
                    return;
                }
                const completedTasks = tasksToConsider.filter(t => t.status === STATUSES.COMPLETED).length;
                const inProgressTasks = tasksToConsider.filter(t => t.status === STATUSES.IN_PROGRESS).length;
                
                const progressValue = completedTasks + (inProgressTasks * 0.5);
                const percentage = Math.round((progressValue / totalTasks) * 100);
                elements.progressBar.style.width = `${percentage}%`;
                elements.progressText.textContent = `${percentage}%`;
            }

            /**
             * Renders the trash view, showing trashed folders and tasks.
             */
            function renderTrashView() {
                elements.mainApp.classList.add('hidden');
                elements.trashView.classList.remove('hidden');
                updateHeader();
                
                // Ensure no other folder is marked as active
                document.querySelectorAll('.folder-item.active').forEach(el => el.classList.remove('active'));
                elements.trashViewButton.classList.add('active');
                
                const trashedFolders = allFolders.filter(f => f.isTrashed);
                const trashedTasks = allTasks.filter(t => t.isTrashed);
                
                elements.emptyTrashState.classList.toggle('hidden', trashedFolders.length > 0 || trashedTasks.length > 0);
                
                // Render trashed folders
                elements.trashedFoldersList.innerHTML = '';
                trashedFolders.forEach(folder => {
                    const li = document.createElement('li');
                    li.className = 'bg-slate-50 p-3 rounded-lg flex items-center justify-between';
                    li.innerHTML = `
                        <span class="flex items-center gap-3 text-slate-700">
                            <i data-lucide="${folder.icon || 'folder-closed'}" class="w-5 h-5"></i>
                            ${folder.name}
                        </span>
                        <div class="flex gap-2">
                            <button class="restore-button flex items-center gap-1 text-sm bg-emerald-100 text-emerald-700 font-semibold py-1 px-3 rounded-md hover:bg-emerald-200 transition-colors" data-id="${folder.id}" data-type="folder"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Restore</button>
                            <button class="delete-permanently-trash-button flex items-center gap-1 text-sm bg-red-100 text-red-700 font-semibold py-1 px-3 rounded-md hover:bg-red-200 transition-colors" data-id="${folder.id}" data-type="folder"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Delete Forever</button>
                        </div>`;
                    li.querySelector('.restore-button').addEventListener('click', () => restoreItem(folder.id, 'folder'));
                    li.querySelector('.delete-permanently-trash-button').addEventListener('click', () => {
                        itemToDelete = { id: folder.id, type: 'folder' };
                        deleteItemPermanently();
                    });
                    elements.trashedFoldersList.appendChild(li);
                });
                
                // Render trashed tasks
                elements.trashedTasksList.innerHTML = '';
                trashedTasks.forEach(task => {
                    const li = document.createElement('li');
                    li.className = 'bg-slate-50 p-3 rounded-lg flex items-center justify-between';
                    li.innerHTML = `
                        <span class="text-slate-700">${task.title}</span>
                        <div class="flex gap-2">
                            <button class="restore-button flex items-center gap-1 text-sm bg-emerald-100 text-emerald-700 font-semibold py-1 px-3 rounded-md hover:bg-emerald-200 transition-colors" data-id="${task.id}" data-type="task"><i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i> Restore</button>
                            <button class="delete-permanently-trash-button flex items-center gap-1 text-sm bg-red-100 text-red-700 font-semibold py-1 px-3 rounded-md hover:bg-red-200 transition-colors" data-id="${task.id}" data-type="task"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i> Delete Forever</button>
                        </div>`;
                    li.querySelector('.restore-button').addEventListener('click', () => restoreItem(task.id, 'task'));
                    li.querySelector('.delete-permanently-trash-button').addEventListener('click', () => {
                        itemToDelete = { id: task.id, type: 'task' };
                        deleteItemPermanently();
                    });
                    elements.trashedTasksList.appendChild(li);
                });
            }

            // --- SECTION: Modals and UI Helpers ---

            /**
             * Updates the main header title based on the selected view.
             */
            function updateHeader() {
                if (selectedFolderId === 'trash') {
                    elements.headerTitle.textContent = 'Trash';
                    return;
                }
                const selectedFolder = allFolders.find(f => f.id === selectedFolderId);
                elements.headerTitle.textContent = selectedFolder ? selectedFolder.name : "All Tasks";
            }

            /**
             * Toggles the sidebar between collapsed (icon-only) and expanded states.
             */
            function toggleSidebar() {
                elements.sidebar.classList.toggle('is-collapsed');
                applySidebarState();
            }

            /**
             * Applies the visual state of the sidebar based on whether it has the 'is-collapsed' class.
             * This function is separated so it can be called on initial load and after re-renders.
             */
            function applySidebarState() {
                const isCollapsed = elements.sidebar.classList.contains('is-collapsed');
                
                elements.sidebar.classList.toggle('w-20', isCollapsed);
                elements.sidebar.classList.toggle('w-64', !isCollapsed);

                elements.burgerMenuButton.innerHTML = `<i data-lucide="${isCollapsed ? 'menu' : 'x'}" class="w-6 h-6"></i>`;
                lucide.createIcons();

                document.querySelectorAll('.sidebar-text').forEach(el => {
                    el.style.display = isCollapsed ? 'none' : '';
                });

                elements.sidebarHeader.classList.toggle('justify-center', isCollapsed);
                elements.sidebarHeader.classList.toggle('justify-between', !isCollapsed);
            }


            /**
             * Opens the task modal, either for a new task or to edit an existing one.
             * @param {object|null} task The task object to edit, or null to create a new one.
             */
            function openTaskModal(task = null) {
                elements.taskDetailsForm.reset();
                updateTaskFolderSelect();
                if (task) {
                    // Pre-fill form for editing
                    elements.modalTitle.textContent = 'Edit Task';
                    elements.taskIdInput.value = task.id;
                    elements.taskTitleInput.value = task.title;
                    elements.taskFolderSelect.value = task.folderId || 'all';
                    elements.taskDescriptionInput.value = task.description || '';
                    elements.taskStartDateInput.value = task.startDate || '';
                    elements.taskEndDateInput.value = task.endDate || '';
                    elements.generateDescriptionButton.classList.toggle('hidden', !task.title);
                } else {
                    // Reset form for a new task
                    elements.modalTitle.textContent = 'Add New Task';
                    elements.taskIdInput.value = '';
                    elements.taskFolderSelect.value = selectedFolderId;
                    elements.generateDescriptionButton.classList.add('hidden');
                }
                elements.taskDetailsModal.classList.remove('hidden');
            }

            /**
             * Opens the folder modal, for creating or editing.
             * @param {object|null} folder The folder object to edit, or null for a new one.
             */
            function openFolderModal(folder = null) {
                elements.folderForm.reset();
                renderIconPicker();
                if(folder) {
                    elements.folderModalTitle.textContent = 'Edit Folder';
                    elements.saveFolderButton.textContent = 'Save';
                    elements.folderIdInput.value = folder.id;
                    elements.folderNameInput.value = folder.name;
                    selectIcon(folder.icon || 'folder-closed');
                } else {
                    elements.folderModalTitle.textContent = 'Create New Folder';
                    elements.saveFolderButton.textContent = 'Create';
                    elements.folderIdInput.value = '';
                    selectIcon('folder-closed');
                }
                elements.folderModal.classList.remove('hidden');
            }

            /**
             * Renders the grid of selectable icons in the folder modal.
             */
            function renderIconPicker() {
                elements.iconPicker.innerHTML = '';
                ICON_NAMES.forEach(iconName => {
                    const button = document.createElement('button');
                    button.type = 'button';
                    button.dataset.icon = iconName;
                    button.className = 'icon-picker-item p-2 rounded-lg hover:bg-slate-200 flex items-center justify-center';
                    button.innerHTML = `<i data-lucide="${iconName}" class="w-5 h-5"></i>`;
                    button.addEventListener('click', () => selectIcon(iconName));
                    elements.iconPicker.appendChild(button);
                });
                lucide.createIcons();
            }

            /**
             * Handles the selection of an icon in the picker.
             * @param {string} iconName The name of the selected Lucide icon.
             */
            function selectIcon(iconName) {
                selectedIcon = iconName;
                document.querySelectorAll('.icon-picker-item').forEach(item => {
                    item.classList.toggle('selected', item.dataset.icon === iconName);
                });
            }

            /**
             * Populates the folder dropdown in the task modal.
             */
            function updateTaskFolderSelect() {
                elements.taskFolderSelect.innerHTML = `<option value="all">No specific folder</option>`;
                allFolders.filter(f => !f.isTrashed).forEach(folder => {
                    elements.taskFolderSelect.innerHTML += `<option value="${folder.id}">${folder.name}</option>`;
                });
            }

            // --- Simple Modal Closing Functions ---
            function closeTaskModal() { elements.taskDetailsModal.classList.add('hidden'); }
            function closeLoginModal() { elements.loginModal.classList.add('hidden'); }
            function openLoginModal() { elements.loginModal.classList.remove('hidden'); }
            function closeAiModal() { elements.aiSuggesterModal.classList.add('hidden'); }
            function openAiModal() { elements.aiSuggesterModal.classList.remove('hidden'); }
            function closeFolderModal() { elements.folderModal.classList.add('hidden'); }

            /**
             * Triggers a confetti celebration effect.
             */
            function triggerConfetti() {
                confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            }

            // --- SECTION: AI Features (Gemini API) ---

            /**
             * Fetches task suggestions from the Gemini API based on a user's goal.
             */
            async function generateSuggestions() {
                const goal = elements.aiGoalInput.value.trim();
                if (!goal) { alert("Please enter a goal."); return; }
                
                // Set UI to loading state
                elements.aiLoadingSpinner.classList.remove('hidden');
                elements.aiErrorMessage.classList.add('hidden');
                elements.aiSuggestionsList.innerHTML = '';
                elements.generateSuggestionsButton.disabled = true;

                const apiKey = ""; // API key is handled by the platform
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=AIzaSyCkWWJRojOVhnZsil_oj3cYPGJQaRZl-54`;
                const prompt = `Break down the following goal into a short list of 5 to 8 small, actionable tasks. Provide only the task titles. Goal: "${goal}"`;
                
                // The payload requests a structured JSON response for easy parsing
                const payload = { 
                    contents: [{ parts: [{ text: prompt }] }], 
                    generationConfig: { 
                        responseMimeType: "application/json", 
                        responseSchema: { type: "OBJECT", properties: { tasks: { type: "ARRAY", items: { type: "STRING" } } } } 
                    } 
                };
                
                try {
                    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
                    const result = await response.json();
                    const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (jsonText) { 
                        renderSuggestions(JSON.parse(jsonText).tasks || []); 
                    } else { 
                        throw new Error("No suggestions found in API response."); 
                    }
                } catch (error) {
                    console.error("Error fetching AI suggestions:", error);
                    elements.aiErrorMessage.textContent = "Sorry, something went wrong. Please try again.";
                    elements.aiErrorMessage.classList.remove('hidden');
                } finally {
                    // Reset UI from loading state
                    elements.aiLoadingSpinner.classList.add('hidden');
                    elements.generateSuggestionsButton.disabled = false;
                }
            }
            
            /**
             * NEW: Fetches an auto-generated description for a task title.
             */
            async function generateDescription() {
                const title = elements.taskTitleInput.value.trim();
                if (!title) {
                    alert("Please enter a title first.");
                    return;
                }

                elements.generateDescriptionButton.disabled = true;
                elements.descriptionSpinner.classList.remove('hidden');

                const apiKey = "";
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=AIzaSyCkWWJRojOVhnZsil_oj3cYPGJQaRZl-54`;
                const prompt = `Based on the following task title, write a short, helpful description for the task. Keep it concise and action-oriented. Title: "${title}"`;

                const payload = { contents: [{ parts: [{ text: prompt }] }] };

                try {
                    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (!response.ok) throw new Error(`API request failed with status ${response.status}`);
                    
                    const result = await response.json();
                    const description = result.candidates?.[0]?.content?.parts?.[0]?.text;

                    if (description) {
                        elements.taskDescriptionInput.value = description.trim();
                    } else {
                        throw new Error("No description found in API response.");
                    }
                } catch (error) {
                    console.error("Error generating description:", error);
                    elements.taskDescriptionInput.value = "Sorry, could not generate a description. Please try again.";
                } finally {
                    elements.generateDescriptionButton.disabled = false;
                    elements.descriptionSpinner.classList.add('hidden');
                }
            }
            
            /**
             * NEW: Generates a summary for the current project.
             */
            async function generateProjectSummary(button) {
                const currentFolder = allFolders.find(f => f.id === selectedFolderId);
                if (!currentFolder) return;

                const tasksInFolder = allTasks.filter(t => t.folderId === selectedFolderId && !t.isTrashed);
                if (tasksInFolder.length < 3) {
                    alert("You need at least 3 tasks in this project to generate a summary.");
                    return;
                }
                
                button.disabled = true;
                button.innerHTML = `<div class="spinner" style="width: 20px; height: 20px; border-width: 2px; border-top-color: white;"></div>`;

                const taskList = tasksInFolder.map(t => `- ${t.title} (Status: ${t.status})`).join('\n');
                const prompt = `You are a project manager. Based on the following list of tasks for the project "${currentFolder.name}", provide a very brief, one-paragraph summary of the project's status. Mention what's done, what's in progress, and what's next. Task List:\n${taskList}`;
                
                const apiKey = "";
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=AIzaSyCkWWJRojOVhnZsil_oj3cYPGJQaRZl-54`;
                const payload = { contents: [{ parts: [{ text: prompt }] }] };
                
                try {
                    const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                    if (!response.ok) throw new Error(`API request failed`);
                    
                    const result = await response.json();
                    const summary = result.candidates?.[0]?.content?.parts?.[0]?.text;
                    
                    if (summary) {
                        elements.projectSummaryText.textContent = summary;
                        elements.projectSummarySection.classList.remove('hidden');
                    }
                } catch(e) {
                    console.error("Summary error:", e);
                    elements.projectSummaryText.textContent = "Could not generate a summary at this time.";
                    elements.projectSummarySection.classList.remove('hidden');
                } finally {
                    button.disabled = false;
                    button.innerHTML = `<i data-lucide="align-left" class="w-5 h-5"></i><span class="hidden sm:inline">Summarize Project</span>`;
                    lucide.createIcons();
                }
            }


            /**
             * Renders the AI-generated task suggestions in the modal.
             * @param {string[]} suggestions An array of task title strings.
             */
            function renderSuggestions(suggestions) {
                elements.aiSuggestionsList.innerHTML = '';
                if (suggestions.length === 0) { 
                    elements.aiSuggestionsList.innerHTML = `<li class="text-slate-500 text-center">No suggestions were found. Try rephrasing your goal.</li>`; 
                    return; 
                }
                suggestions.forEach(title => {
                    const li = document.createElement('li');
                    li.className = 'flex items-center justify-between bg-slate-100 p-3 rounded-lg';
                    li.innerHTML = `<span class="text-slate-800">${title}</span>`;
                    const addButton = document.createElement('button');
                    addButton.innerHTML = `<i data-lucide="plus"></i>`;
                    addButton.className = 'bg-blue-100 text-blue-600 p-1.5 rounded-full hover:bg-blue-200 transition-colors';
                    addButton.setAttribute('aria-label', `Add task: ${title}`);
                    // Clicking "Add" saves the task and visually disables the suggestion
                    addButton.onclick = () => {
                        saveTask({ title, folderId: selectedFolderId });
                        li.classList.add('opacity-50', 'pointer-events-none');
                        addButton.innerHTML = `<i data-lucide="check"></i>`;
                        addButton.className = 'bg-emerald-100 text-emerald-600 p-1.5 rounded-full';
                        lucide.createIcons();
                    };
                    li.appendChild(addButton);
                    elements.aiSuggestionsList.appendChild(li);
                });
                lucide.createIcons();
            }
            
            /**
             * NEW: Updates the action buttons in the header, adding a summary button if a project is selected.
             */
            function updateActionButtons() {
                // Clear any existing summary button
                const existingBtn = document.getElementById('summarize-project-button');
                if(existingBtn) existingBtn.remove();
                
                elements.projectSummarySection.classList.add('hidden');

                // If a specific folder is selected (and not 'all' or 'trash')
                if (selectedFolderId !== 'all' && selectedFolderId !== 'trash') {
                    const summarizeButton = document.createElement('button');
                    summarizeButton.id = 'summarize-project-button';
                    summarizeButton.ariaLabel = "Summarize Project with AI";
                    summarizeButton.className = "bg-green-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2";
                    summarizeButton.innerHTML = `<i data-lucide="align-left" class="w-5 h-5"></i><span class="hidden sm:inline">Summarize Project</span>`;
                    summarizeButton.addEventListener('click', () => generateProjectSummary(summarizeButton));
                    // Add the new button before the "Suggest Tasks" button
                    elements.mainActionButtons.insertBefore(summarizeButton, elements.openAiSuggesterButton);
                    lucide.createIcons();
                }
            }


            // --- SECTION: Initial Setup and Event Listeners ---

            // Authentication listeners
            elements.signInPromptButton.addEventListener('click', openLoginModal);
            elements.closeLoginModalButton.addEventListener('click', closeLoginModal);
            elements.signOutButton.addEventListener('click', () => signOut(auth));
            elements.googleSignInButton.addEventListener('click', () => signIn(new GoogleAuthProvider()));
            elements.githubSignInButton.addEventListener('click', () => signIn(new GithubAuthProvider()));

            // Sidebar listener
            elements.burgerMenuButton.addEventListener('click', () => toggleSidebar());

            // Task modal listeners
            elements.openAddTaskModalButton.addEventListener('click', () => openTaskModal());
            elements.cancelTaskButton.addEventListener('click', closeTaskModal);
            elements.taskDetailsForm.addEventListener('submit', handleTaskFormSubmit);
            elements.taskTitleInput.addEventListener('input', () => {
                elements.generateDescriptionButton.classList.toggle('hidden', !elements.taskTitleInput.value.trim());
            });
            elements.generateDescriptionButton.addEventListener('click', generateDescription);


            // Folder modal listeners
            elements.openAddFolderModalButton.addEventListener('click', () => openFolderModal());
            elements.cancelFolderButton.addEventListener('click', closeFolderModal);
            elements.folderForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const folderData = {
                    id: elements.folderIdInput.value,
                    name: elements.folderNameInput.value.trim(),
                    icon: selectedIcon,
                };
                if(folderData.name) saveFolder(folderData);
            });

            // Delete confirmation modal listeners
            elements.cancelDeleteButton.addEventListener('click', closeDeleteConfirmationModal);
            elements.trashItemButton.addEventListener('click', moveItemToTrash);
            elements.deletePermanentlyButton.addEventListener('click', deleteItemPermanently);

            // AI Suggester modal listeners
            elements.openAiSuggesterButton.addEventListener('click', openAiModal);
            elements.closeAiModalButton.addEventListener('click', closeAiModal);
            elements.generateSuggestionsButton.addEventListener('click', generateSuggestions);

            // Folder/Trash navigation listeners
            elements.folderList.addEventListener('click', handleFolderSelect);
            elements.trashViewButton.addEventListener('click', (e) => {
                e.preventDefault();
                selectedFolderId = 'trash';
                renderAll();
            });

            // Initialize the app
            setupDragAndDropListeners();
            setupReorderListeners(); // <-- Add this line to enable reordering
            applySidebarState(); // Set initial sidebar state
            lucide.createIcons(); // Initial icon rendering
        });