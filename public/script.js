class InventoryManager {
    constructor() {
        this.currentView = 'inventory';
        this.locations = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadLocations();
        this.showView('inventory');
        this.loadInventory();
    }

    setupEventListeners() {
        // Navigation
        document.getElementById('inventoryTab').addEventListener('click', () => this.showView('inventory'));
        document.getElementById('shoppingTab').addEventListener('click', () => this.showView('shopping'));
        document.getElementById('addItemTab').addEventListener('click', () => this.showView('addItem'));

        // Refresh buttons
        document.getElementById('refreshInventory').addEventListener('click', () => this.loadInventory());
        document.getElementById('refreshShopping').addEventListener('click', () => this.loadShoppingList());

        // Location filters
        document.getElementById('locationFilter').addEventListener('change', () => this.loadInventory());
        document.getElementById('shoppingLocationFilter').addEventListener('change', () => this.loadShoppingList());

        // Add Form handling
        document.getElementById('itemForm').addEventListener('submit', (e) => this.handleAddFormSubmit(e));
        document.getElementById('cancelForm').addEventListener('click', () => this.resetAddForm());

        // Edit Modal handling
        document.getElementById('editItemForm').addEventListener('submit', (e) => this.handleEditFormSubmit(e));
        
        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('editModal')) {
                this.closeEditModal();
            }
        });
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
        }
    }

    async loadLocations() {
        try {
            const response = await fetch('/api/locations');
            this.locations = await response.json();
            
            const locationFilter = document.getElementById('locationFilter');
            const shoppingLocationFilter = document.getElementById('shoppingLocationFilter');
            
            // Clear existing options (except "All Locations")
            locationFilter.innerHTML = '<option value="">All Locations</option>';
            shoppingLocationFilter.innerHTML = '<option value="">All Locations</option>';
            
            // Add location options
            this.locations.forEach(location => {
                const option1 = new Option(location, location);
                const option2 = new Option(location, location);
                locationFilter.appendChild(option1);
                shoppingLocationFilter.appendChild(option2);
            });
        } catch (error) {
            console.error('Error loading locations:', error);
        }
    }

    async loadInventory() {
        const locationFilter = document.getElementById('locationFilter').value;
        const url = locationFilter ? `/api/inventory/location/${encodeURIComponent(locationFilter)}` : '/api/inventory';
        
        try {
            const response = await fetch(url);
            const inventory = await response.json();
            this.renderInventoryTable(inventory);
        } catch (error) {
            console.error('Error loading inventory:', error);
            this.showError('Failed to load inventory data');
        }
    }

    async loadShoppingList() {
        const locationFilter = document.getElementById('shoppingLocationFilter').value;
        const url = locationFilter ? `/api/shopping-list/location/${encodeURIComponent(locationFilter)}` : '/api/shopping-list';
        
        try {
            const response = await fetch(url);
            const shoppingList = await response.json();
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
            targetAmount: parseInt(document.getElementById('targetAmount').value) || 0
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
                this.showSuccess('Item added successfully');
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
                this.showSuccess('Item updated successfully');
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
            const response = await fetch('/api/inventory');
            const inventory = await response.json();
            const item = inventory.find(i => i.id === id);
            
            if (item) {
                document.getElementById('editItemId').value = item.id;
                document.getElementById('editBrand').value = item.brand;
                document.getElementById('editItem').value = item.item;
                document.getElementById('editLocation').value = item.location;
                document.getElementById('editCurrentCount').value = item.currentCount;
                document.getElementById('editTargetAmount').value = item.targetAmount;
                
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
                this.showSuccess('Item deleted successfully');
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
                this.showSuccess(`Added ${amount} ${item.item} to inventory`);
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
        // Simple alert for now - can be enhanced with toast notifications
        alert('Success: ' + message);
    }

    showError(message) {
        // Simple alert for now - can be enhanced with toast notifications
        alert('Error: ' + message);
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