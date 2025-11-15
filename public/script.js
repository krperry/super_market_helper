class InventoryManager {
    constructor() {
        this.currentView = 'inventory';
        this.locations = [];
        this.currentStoreId = null;
        this.stores = [];
        this.init();
    }

    init() {
        this.loadStores().then(() => {
            this.setupEventListeners();
            this.loadLocations();
            this.showView('inventory');
            this.loadInventory();
        });
    }

    async loadStores() {
        try {
            const response = await fetch('/api/stores');
            this.stores = await response.json();
            
            if (this.stores.length > 0) {
                this.currentStoreId = this.stores[0].id;
                this.populateStoreSelector();
            }
        } catch (error) {
            console.error('Error loading stores:', error);
        }
    }

    populateStoreSelector() {
        const storeSelect = document.getElementById('currentStore');
        storeSelect.innerHTML = '';
        
        this.stores.forEach(store => {
            const option = document.createElement('option');
            option.value = store.id;
            option.textContent = store.name;
            if (store.id === this.currentStoreId) {
                option.selected = true;
            }
            storeSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('inventoryTab').addEventListener('click', () => this.showView('inventory'));
        document.getElementById('shoppingTab').addEventListener('click', () => this.showView('shopping'));
        document.getElementById('addItemTab').addEventListener('click', () => this.showView('addItem'));
        document.getElementById('locationsTab').addEventListener('click', () => this.showView('locations'));
        document.getElementById('storesTab').addEventListener('click', () => this.showView('stores'));

        // Store selector
        document.getElementById('currentStore').addEventListener('change', (e) => {
            this.currentStoreId = parseInt(e.target.value);
            this.onStoreChange();
        });

        // Refresh buttons
        document.getElementById('refreshInventory').addEventListener('click', () => this.loadInventory());
        document.getElementById('refreshShopping').addEventListener('click', () => this.loadShoppingList());

        // Location filters
        document.getElementById('locationFilter').addEventListener('change', () => this.loadInventory());
        document.getElementById('shoppingLocationFilter').addEventListener('change', () => this.loadShoppingList());

        // Search filters
        document.getElementById('searchItems').addEventListener('input', () => this.loadInventory());
        document.getElementById('searchShopping').addEventListener('input', () => this.loadShoppingList());

        // Add Form handling
        document.getElementById('itemForm').addEventListener('submit', (e) => this.handleAddFormSubmit(e));
        document.getElementById('cancelForm').addEventListener('click', () => this.resetAddForm());

        // Edit Modal handling
        document.getElementById('editItemForm').addEventListener('submit', (e) => this.handleEditFormSubmit(e));
        
        // Edit Location Modal handling
        document.getElementById('editLocationForm').addEventListener('submit', (e) => this.handleEditLocationSubmit(e));
        
        // Store form handling
        document.getElementById('addStoreForm').addEventListener('submit', (e) => this.handleAddStore(e));
        document.getElementById('editStoreForm').addEventListener('submit', (e) => this.handleEditStoreSubmit(e));
        
        window.addEventListener('click', (e) => {
            const editModal = document.getElementById('editModal');
            if (e.target === editModal) {
                this.closeEditModal();
            }
            const editLocationModal = document.getElementById('editLocationModal');
            if (e.target === editLocationModal) {
                this.closeEditLocationModal();
            }
            const editStoreModal = document.getElementById('editStoreModal');
            if (e.target === editStoreModal) {
                this.closeEditStoreModal();
            }
        });
    }

    onStoreChange() {
        this.loadLocations();
        
        // Reload current view data
        switch(this.currentView) {
            case 'inventory':
                this.loadInventory();
                break;
            case 'shopping':
                this.loadShoppingList();
                break;
            case 'locations':
                this.loadLocationsView();
                break;
            case 'stores':
                this.loadStoresView();
                break;
        }
    }

    showView(viewName) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

        // Show selected view
        document.getElementById(`${viewName}View`).classList.add('active');
        document.getElementById(`${viewName}Tab`).classList.add('active');

        this.currentView = viewName;

        // Load data based on view
        switch(viewName) {
            case 'inventory':
                this.loadInventory();
                break;
            case 'shopping':
                this.loadShoppingList();
                break;
            case 'addItem':
                this.resetAddForm();
                break;
            case 'locations':
                this.loadLocationsView();
                break;
            case 'stores':
                this.loadStoresView();
                break;
        }
    }

    async loadLocations() {
        try {
            const response = await fetch(`/api/locations?store_id=${this.currentStoreId}`);
            this.locations = await response.json();
            
            const locationFilter = document.getElementById('locationFilter');
            const shoppingLocationFilter = document.getElementById('shoppingLocationFilter');
            const locationList = document.getElementById('locationList');
            const editLocationList = document.getElementById('editLocationList');
            
            // Clear existing options (except "All Locations")
            if (locationFilter) {
                locationFilter.innerHTML = '<option value="">All Locations</option>';
            }
            if (shoppingLocationFilter) {
                shoppingLocationFilter.innerHTML = '<option value="">All Locations</option>';
            }
            if (locationList) {
                locationList.innerHTML = '';
            }
            if (editLocationList) {
                editLocationList.innerHTML = '';
            }
            
            // Add location options
            this.locations.forEach(location => {
                if (locationFilter) {
                    const option1 = new Option(location, location);
                    locationFilter.appendChild(option1);
                }
                if (shoppingLocationFilter) {
                    const option2 = new Option(location, location);
                    shoppingLocationFilter.appendChild(option2);
                }
                
                // Add to datalists
                if (locationList) {
                    const dataOption1 = document.createElement('option');
                    dataOption1.value = location;
                    locationList.appendChild(dataOption1);
                }
                if (editLocationList) {
                    const dataOption2 = document.createElement('option');
                    dataOption2.value = location;
                    editLocationList.appendChild(dataOption2);
                }
            });
        } catch (error) {
            console.error('Error loading locations:', error);
        }
    }

    async loadInventory() {
        const locationFilter = document.getElementById('locationFilter').value;
        const searchTerm = document.getElementById('searchItems').value.toLowerCase().trim();
        const baseUrl = locationFilter ? `/api/inventory/location/${encodeURIComponent(locationFilter)}` : '/api/inventory';
        const url = `${baseUrl}?store_id=${this.currentStoreId}`;
        
        try {
            const response = await fetch(url);
            let inventory = await response.json();
            
            // Apply search filter
            if (searchTerm) {
                inventory = inventory.filter(item => 
                    item.brand.toLowerCase().includes(searchTerm) || 
                    item.item.toLowerCase().includes(searchTerm)
                );
            }
            
            this.renderInventoryTable(inventory);
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showError('Failed to load inventory data');
        }
    }

    async loadShoppingList() {
        const locationFilter = document.getElementById('shoppingLocationFilter').value;
        const searchTerm = document.getElementById('searchShopping').value.toLowerCase().trim();
        const baseUrl = locationFilter ? `/api/shopping-list/location/${encodeURIComponent(locationFilter)}` : '/api/shopping-list';
        const url = `${baseUrl}?store_id=${this.currentStoreId}`;
        
        try {
            const response = await fetch(url);
            let shoppingList = await response.json();
            
            // Apply search filter
            if (searchTerm) {
                shoppingList = shoppingList.filter(item => 
                    item.brand.toLowerCase().includes(searchTerm) || 
                    item.item.toLowerCase().includes(searchTerm)
                );
            }
            
            this.renderShoppingTable(shoppingList);
        } catch (error) {
            console.error('Error loading shopping list:', error);
            this.showError('Failed to load shopping list');
        }
    }

    renderInventoryTable(inventory) {
        const tbody = document.querySelector('#inventoryTable tbody');
        tbody.innerHTML = '';

        if (inventory.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="empty-state">No inventory items found</td></tr>';
            return;
        }

        inventory.forEach(item => {
            const row = document.createElement('tr');
            const status = this.getItemStatus(item);
            
            // Create dropdown options for current count (0 to targetAmount)
            let countOptions = '';
            const maxCount = item.targetAmount > 0 ? item.targetAmount : 10;
            for (let i = 0; i <= maxCount; i++) {
                const selected = i === item.currentCount ? 'selected' : '';
                countOptions += `<option value="${i}" ${selected}>${i}</option>`;
            }
            
            row.innerHTML = `
                <td>${this.escapeHtml(item.brand)}</td>
                <td>${this.escapeHtml(item.item)}</td>
                <td>${this.escapeHtml(item.location)}</td>
                <td>
                    <select class="count-dropdown" onchange="inventoryManager.updateCount(${item.id}, this.value)">
                        ${countOptions}
                    </select>
                </td>
                <td>${item.targetAmount}</td>
                <td><span class="status-${status.class}">${status.text}</span></td>
                <td>
                    <button class="btn-edit btn-small" onclick="inventoryManager.editItem(${item.id})">Edit</button>
                    <button class="btn-delete btn-small" onclick="inventoryManager.deleteItem(${item.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderShoppingTable(shoppingList) {
        const tbody = document.querySelector('#shoppingTable tbody');
        tbody.innerHTML = '';

        if (shoppingList.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No items needed for shopping</td></tr>';
            return;
        }

        shoppingList.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.escapeHtml(item.brand)}</td>
                <td>${this.escapeHtml(item.item)}</td>
                <td>${this.escapeHtml(item.location)}</td>
                <td>${item.currentCount}</td>
                <td>${item.targetAmount}</td>
                <td><strong>${item.needed}</strong></td>
                <td><input type="number" class="purchase-amount" data-item-id="${item.id}" min="0" value="${item.needed}" style="width: 60px;"></td>
                <td><input type="checkbox" class="purchase-checkbox" data-item-id="${item.id}"></td>
            `;
            
            // Add event listener for checkbox
            const checkbox = row.querySelector('.purchase-checkbox');
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const amount = parseInt(row.querySelector('.purchase-amount').value) || 0;
                    this.addPurchaseToInventory(item.id, amount);
                }
            });
            
            tbody.appendChild(row);
        });
    }

    getItemStatus(item) {
        if (item.currentCount === 0) {
            return { class: 'out', text: 'Out of Stock' };
        } else if (item.currentCount < item.targetAmount) {
            return { class: 'low', text: 'Low Stock' };
        } else if (item.currentCount > item.targetAmount) {
            return { class: 'over', text: 'Overstocked' };
        } else {
            return { class: 'ok', text: 'In Stock' };
        }
    }

    async handleAddFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            brand: document.getElementById('brand').value.trim(),
            item: document.getElementById('item').value.trim(),
            location: document.getElementById('location').value.trim(),
            currentCount: parseInt(document.getElementById('currentCount').value) || 0,
            targetAmount: parseInt(document.getElementById('targetAmount').value) || 0,
            store_id: this.currentStoreId
        };

        try {
            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.resetAddForm();
                this.loadLocations();
                this.loadInventory();
            } else {
                const error = await response.json();
                this.showError(error.error || 'Failed to add item');
            }
        } catch (error) {
            console.error('Error adding item:', error);
            this.showError('Failed to add item');
        }
    }

    async handleEditFormSubmit(e) {
        e.preventDefault();
        
        const itemId = document.getElementById('editItemId').value;
        const formData = {
            brand: document.getElementById('editBrand').value.trim(),
            item: document.getElementById('editItem').value.trim(),
            location: document.getElementById('editLocation').value.trim(),
            currentCount: parseInt(document.getElementById('editCurrentCount').value) || 0,
            targetAmount: parseInt(document.getElementById('editTargetAmount').value) || 0
        };

        try {
            const response = await fetch(`/api/inventory/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                this.closeEditModal();
                this.loadLocations();
                this.loadInventory();
            } else {
                const error = await response.json();
                this.showError(error.error || 'Failed to update item');
            }
        } catch (error) {
            console.error('Error updating item:', error);
            this.showError('Failed to update item');
        }
    }

    async editItem(id) {
        try {
            const response = await fetch(`/api/inventory?store_id=${this.currentStoreId}`);
            const inventory = await response.json();
            const item = inventory.find(i => i.id === id);
            
            if (item) {
                document.getElementById('editItemId').value = item.id;
                document.getElementById('editBrand').value = item.brand;
                document.getElementById('editItem').value = item.item;
                document.getElementById('editLocation').value = item.location;
                document.getElementById('editCurrentCount').value = item.currentCount;
                document.getElementById('editTargetAmount').value = item.targetAmount;
                
                // Ensure location field is enabled and editable
                const editLocationInput = document.getElementById('editLocation');
                if (editLocationInput) {
                    editLocationInput.disabled = false;
                    editLocationInput.readOnly = false;
                }
                
                document.getElementById('editModal').style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading item for edit:', error);
            this.showError('Failed to load item data');
        }
    }

    async deleteItem(id) {
        if (!confirm('Are you sure you want to delete this item?')) {
            return;
        }

        try {
            const response = await fetch(`/api/inventory/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.loadLocations();
                this.loadInventory();
            } else {
                const error = await response.json();
                this.showError(error.error || 'Failed to delete item');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            this.showError('Failed to delete item');
        }
    }

    async updateCount(id, newCount) {
        try {
            // Get current item to preserve targetAmount
            const response = await fetch('/api/inventory');
            const inventory = await response.json();
            const item = inventory.find(i => i.id === id);
            
            if (!item) return;
            
            const updateResponse = await fetch(`/api/inventory/${id}/quantity`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentCount: parseInt(newCount),
                    targetAmount: item.targetAmount
                })
            });

            if (updateResponse.ok) {
                this.loadInventory(); // Refresh to update status
            } else {
                const error = await updateResponse.json();
                this.showError(error.error || 'Failed to update count');
                this.loadInventory(); // Reload to reset dropdown
            }
        } catch (error) {
            console.error('Error updating count:', error);
            this.showError('Failed to update count');
            this.loadInventory(); // Reload to reset dropdown
        }
    }

    async addPurchaseToInventory(id, amount) {
        if (amount <= 0) {
            this.showError('Purchase amount must be greater than 0');
            return;
        }

        try {
            // Get current item
            const response = await fetch('/api/inventory');
            const inventory = await response.json();
            const item = inventory.find(i => i.id === id);
            
            if (!item) return;
            
            const newCount = item.currentCount + amount;
            
            const updateResponse = await fetch(`/api/inventory/${id}/quantity`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    currentCount: newCount,
                    targetAmount: item.targetAmount
                })
            });

            if (updateResponse.ok) {
                this.loadShoppingList(); // Refresh shopping list
            } else {
                const error = await updateResponse.json();
                this.showError(error.error || 'Failed to add purchase');
            }
        } catch (error) {
            console.error('Error adding purchase:', error);
            this.showError('Failed to add purchase');
        }
    }

    resetAddForm() {
        document.getElementById('itemForm').reset();
        document.getElementById('formTitle').textContent = 'Add New Item';
        
        // Ensure location field is enabled and editable
        const locationInput = document.getElementById('location');
        if (locationInput) {
            locationInput.disabled = false;
            locationInput.readOnly = false;
        }
    }

    closeEditModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showSuccess(message) {
        // Silent success - no dialog needed
        console.log('Success: ' + message);
    }

    showError(message) {
        // Simple alert for now - can be enhanced with toast notifications
        alert('Error: ' + message);
    }

    // Location Management Functions
    async loadLocationsView() {
        try {
            const response = await fetch(`/api/inventory?store_id=${this.currentStoreId}`);
            const inventory = await response.json();
            
            // Count items per location
            const locationCounts = {};
            inventory.forEach(item => {
                locationCounts[item.location] = (locationCounts[item.location] || 0) + 1;
            });
            
            const tbody = document.querySelector('#locationsTable tbody');
            tbody.innerHTML = '';
            
            if (this.locations.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No locations defined</td></tr>';
                return;
            }
            
            this.locations.forEach(location => {
                const count = locationCounts[location] || 0;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${this.escapeHtml(location)}</td>
                    <td>${count}</td>
                    <td>
                        <button class="btn-edit btn-small" onclick="inventoryManager.editLocation('${this.escapeHtml(location)}')">Rename</button>
                        <button class="btn-delete btn-small" onclick="inventoryManager.deleteLocation('${this.escapeHtml(location)}', ${count})">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        } catch (error) {
            console.error('Error loading locations view:', error);
            this.showError('Failed to load locations');
        }
    }

    async addLocation() {
        const newLocationName = document.getElementById('newLocationName').value.trim();
        
        if (!newLocationName) {
            this.showError('Please enter a location name');
            return;
        }
        
        if (this.locations.includes(newLocationName)) {
            this.showError('This location already exists');
            return;
        }
        
        try {
            // Create a placeholder item to register the location
            // This item will remain in the database to keep the location active
            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    brand: '(Location Placeholder)',
                    item: `Location: ${newLocationName}`,
                    location: newLocationName,
                    currentCount: 0,
                    targetAmount: 0,
                    store_id: this.currentStoreId
                })
            });
            
            if (response.ok) {
                // Reload locations and refresh the view
                await this.loadLocations();
                document.getElementById('newLocationName').value = '';
                this.loadLocationsView();
            } else {
                this.showError('Failed to add location');
            }
        } catch (error) {
            console.error('Error adding location:', error);
            this.showError('Failed to add location');
        }
    }

    editLocation(oldName) {
        document.getElementById('oldLocationName').value = oldName;
        document.getElementById('newLocationNameEdit').value = oldName;
        document.getElementById('editLocationModal').style.display = 'block';
    }

    async handleEditLocationSubmit(e) {
        e.preventDefault();
        
        const oldName = document.getElementById('oldLocationName').value;
        const newName = document.getElementById('newLocationNameEdit').value.trim();
        
        if (!newName) {
            this.showError('Please enter a location name');
            return;
        }
        
        if (oldName === newName) {
            this.closeEditLocationModal();
            return;
        }
        
        try {
            // Update all items with this location
            const response = await fetch('/api/inventory');
            const inventory = await response.json();
            const itemsToUpdate = inventory.filter(item => item.location === oldName);
            
            if (itemsToUpdate.length === 0) {
                this.closeEditLocationModal();
                await this.loadLocations();
                this.loadLocationsView();
                this.showSuccess('Location renamed');
                return;
            }
            
            // Update each item
            for (const item of itemsToUpdate) {
                await fetch(`/api/inventory/${item.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...item,
                        location: newName
                    })
                });
            }
            
            this.closeEditLocationModal();
            await this.loadLocations();
            this.loadLocationsView();
        } catch (error) {
            console.error('Error renaming location:', error);
            this.showError('Failed to rename location');
        }
    }

    async deleteLocation(locationName, itemCount) {
        if (itemCount > 0) {
            if (!confirm(`This location has ${itemCount} items. Deleting the location will also delete all items in it. Are you sure?`)) {
                return;
            }
        } else {
            if (!confirm(`Are you sure you want to delete the location "${locationName}"?`)) {
                return;
            }
        }
        
        try {
            // Get all items in this location
            const response = await fetch(`/api/inventory?store_id=${this.currentStoreId}`);
            const inventory = await response.json();
            const itemsToDelete = inventory.filter(item => item.location === locationName);
            
            // Delete each item
            for (const item of itemsToDelete) {
                await fetch(`/api/inventory/${item.id}`, {
                    method: 'DELETE'
                });
            }
            
            await this.loadLocations();
            this.loadLocationsView();
        } catch (error) {
            console.error('Error deleting location:', error);
            this.showError('Failed to delete location');
        }
    }

    closeEditLocationModal() {
        document.getElementById('editLocationModal').style.display = 'none';
    }

    // Store Management Methods
    async loadStoresView() {
        const storesList = document.getElementById('storesList');
        
        if (!storesList) {
            console.error('storesList element not found');
            return;
        }
        
        storesList.innerHTML = '';
        
        if (!this.stores || this.stores.length === 0) {
            storesList.innerHTML = '<p class="empty-state">No stores available. This shouldn\'t happen!</p>';
            return;
        }
        
        this.stores.forEach(store => {
            const storeDiv = document.createElement('div');
            storeDiv.className = 'store-item';
            if (store.id === this.currentStoreId) {
                storeDiv.classList.add('current-store');
            }
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'store-item-name';
            nameSpan.textContent = store.name;
            
            if (store.id === this.currentStoreId) {
                const badge = document.createElement('span');
                badge.className = 'store-item-badge';
                badge.textContent = 'Current';
                nameSpan.appendChild(badge);
            }
            
            const buttonGroup = document.createElement('div');
            
            const renameBtn = document.createElement('button');
            renameBtn.textContent = 'Rename';
            renameBtn.className = 'btn-edit btn-small';
            renameBtn.onclick = () => this.editStore(store.id, store.name);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'btn-delete btn-small';
            deleteBtn.onclick = () => this.deleteStore(store.id, store.name);
            
            buttonGroup.appendChild(renameBtn);
            buttonGroup.appendChild(deleteBtn);
            
            storeDiv.appendChild(nameSpan);
            storeDiv.appendChild(buttonGroup);
            storesList.appendChild(storeDiv);
        });
    }

    async handleAddStore(e) {
        e.preventDefault();
        
        const storeName = document.getElementById('newStoreName').value.trim();
        const copyItems = document.getElementById('copyItems').checked;
        
        if (!storeName) {
            this.showError('Store name is required');
            return;
        }
        
        try {
            const response = await fetch('/api/stores', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: storeName,
                    copyFromStoreId: copyItems ? this.currentStoreId : null
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                document.getElementById('newStoreName').value = '';
                document.getElementById('copyItems').checked = true;
                
                await this.loadStores();
                this.loadStoresView();
            } else {
                const error = await response.json();
                this.showError(error.error || 'Failed to add store');
            }
        } catch (error) {
            console.error('Error adding store:', error);
            this.showError('Failed to add store');
        }
    }

    async deleteStore(storeId, storeName) {
        if (!confirm(`Are you sure you want to delete store "${storeName}"? This will delete all inventory in this store.`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/stores/${storeId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                await this.loadStores();
                
                // If we deleted the current store, switch to the first available store
                if (storeId === this.currentStoreId && this.stores.length > 0) {
                    this.currentStoreId = this.stores[0].id;
                    this.populateStoreSelector();
                    this.onStoreChange();
                }
                
                this.loadStoresView();
            } else {
                const error = await response.json();
                this.showError(error.error || 'Failed to delete store');
            }
        } catch (error) {
            console.error('Error deleting store:', error);
            this.showError('Failed to delete store');
        }
    }

    editStore(storeId, currentName) {
        document.getElementById('editStoreId').value = storeId;
        document.getElementById('editStoreName').value = currentName;
        document.getElementById('editStoreModal').style.display = 'block';
    }

    async handleEditStoreSubmit(e) {
        e.preventDefault();
        
        const storeId = document.getElementById('editStoreId').value;
        const newName = document.getElementById('editStoreName').value.trim();
        
        if (!newName) {
            this.showError('Store name cannot be empty');
            return;
        }
        
        try {
            const response = await fetch(`/api/stores/${storeId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newName })
            });
            
            if (response.ok) {
                this.closeEditStoreModal();
                await this.loadStores();
                this.populateStoreSelector();
                this.loadStoresView();
            } else {
                const error = await response.json();
                this.showError(error.error || 'Failed to rename store');
            }
        } catch (error) {
            console.error('Error renaming store:', error);
            this.showError('Failed to rename store');
        }
    }

    closeEditStoreModal() {
        document.getElementById('editStoreModal').style.display = 'none';
    }
}

// Initialize the application when the page loads
let inventoryManager;
document.addEventListener('DOMContentLoaded', () => {
    inventoryManager = new InventoryManager();
});

// Global functions for button onclick handlers
window.closeEditModal = () => {
    inventoryManager.closeEditModal();
};

window.closeEditLocationModal = () => {
    inventoryManager.closeEditLocationModal();
};

window.closeEditStoreModal = () => {
    inventoryManager.closeEditStoreModal();
};