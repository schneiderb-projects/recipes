let recipes = [];

// Fetch recipes from the backend
async function fetchRecipes() {
    try {
        const response = await fetch('/api/recipes');
        recipes = await response.json();
        displayRecipes();
        updateTagFilter(); // Update tag filter after loading recipes
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
}

// Display recipes in the grid
function displayRecipes() {
    const recipeGrid = document.querySelector('.recipe-grid');
    recipeGrid.innerHTML = '';

    recipes.forEach(recipe => {
        const recipeCard = createRecipeCard(recipe);
        
        recipeCard.addEventListener('click', (e) => {
            // Don't show modal if clicking the remove or tag button
            if (!e.target.closest('.remove-recipe-button') && !e.target.closest('.tag-recipe-button')) {
                showModal(recipe);
            }
        });

        // Add remove button event listener
        const removeButton = recipeCard.querySelector('.remove-recipe-button');
        let isConfirming = false;

        removeButton.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevent modal from opening
            
            if (!isConfirming) {
                // First click - change to confirm state
                isConfirming = true;
                removeButton.textContent = 'Confirm';
                removeButton.classList.add('confirm');
                
                // Reset after 3 seconds if not clicked again
                setTimeout(() => {
                    if (isConfirming) {
                        isConfirming = false;
                        removeButton.textContent = '×';
                        removeButton.classList.remove('confirm');
                    }
                }, 3000);
            } else {
                // Second click - remove the recipe
                try {
                    const response = await fetch(`/api/recipes/${recipe.id}`, {
                        method: 'DELETE'
                    });

                    if (!response.ok) {
                        throw new Error('Failed to remove recipe');
                    }

                    // Remove recipe from local array and update display
                    recipes = recipes.filter(r => r.id !== recipe.id);
                    displayRecipes();
                } catch (error) {
                    console.error('Error removing recipe:', error);
                    alert('Failed to remove recipe. Please try again.');
                }
            }
        });

        // Add tag button event listener
        const tagButton = recipeCard.querySelector('.tag-recipe-button');
        tagButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent recipe modal from opening
            showTagModal(recipe.id, recipe.title);
        });

        recipeGrid.appendChild(recipeCard);
    });
}

// Modal functionality
const modal = document.getElementById('recipeModal');
const modalTitle = document.getElementById('modalTitle');
const modalImage = document.getElementById('modalImage');
const ingredientsList = document.getElementById('ingredientsList');
const instructionsContent = document.getElementById('instructionsContent');
const modalClose = document.querySelector('.modal-close');

function showModal(recipe) {
    modalTitle.textContent = recipe.title;
    modalImage.src = recipe.image;
    modalImage.alt = recipe.title;
    
    // Clear previous content
    ingredientsList.innerHTML = '';
    instructionsContent.innerHTML = '';
    
    // Add ingredients to the list
    recipe.ingredients.forEach(ingredient => {
        const li = document.createElement('li');
        li.textContent = ingredient;
        ingredientsList.appendChild(li);
    });
    
    // Add instructions
    instructionsContent.textContent = recipe.instructions;
    
    // Show modal with animation
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
}

// Close modal when clicking the close button or outside the modal
modalClose.addEventListener('click', hideModal);
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        hideModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
        hideModal();
    }
});

// Add Recipe Modal Elements
const addRecipeModal = document.getElementById('addRecipeModal');
const addRecipeButton = document.querySelector('.add-recipe-button');
const addRecipeForm = document.getElementById('addRecipeForm');
const addRecipeClose = addRecipeModal.querySelector('.modal-close');
const recipeTagsInput = document.getElementById('recipeTags');
const addRecipeTagAutocomplete = document.getElementById('addRecipeTagAutocomplete');
const selectedTagsContainer = document.getElementById('selectedTags');
const cancelButton = addRecipeForm.querySelector('.cancel-button');
let activeAddRecipeAutocompleteItem = -1;
let selectedTags = new Set();

function createTagBubble(tag) {
    const bubble = document.createElement('div');
    bubble.className = 'tag-bubble';
    bubble.innerHTML = `
        <span>${tag}</span>
        <span class="remove-tag" data-tag="${tag}">×</span>
    `;
    return bubble;
}

function updateSelectedTags() {
    selectedTagsContainer.innerHTML = '';
    selectedTags.forEach(tag => {
        const bubble = createTagBubble(tag);
        selectedTagsContainer.appendChild(bubble);
    });

    // Add event listeners to remove buttons
    selectedTagsContainer.querySelectorAll('.remove-tag').forEach(button => {
        button.addEventListener('click', () => {
            const tagToRemove = button.dataset.tag;
            selectedTags.delete(tagToRemove);
            updateSelectedTags();
        });
    });
}

function updateAddRecipeAutocomplete(input) {
    const value = input.value.toLowerCase().trim();
    if (!value) {
        hideAddRecipeAutocomplete();
        return;
    }

    // Get all unique tags from all recipes
    const allTags = new Set();
    recipes.forEach(recipe => {
        if (recipe.tags && Array.isArray(recipe.tags)) {
            recipe.tags.forEach(tag => allTags.add(tag));
        }
    });

    // Filter tags that match the input and aren't already selected
    const matchingTags = Array.from(allTags)
        .filter(tag => tag.toLowerCase().includes(value) && !selectedTags.has(tag))
        .sort();

    // Create autocomplete items
    addRecipeTagAutocomplete.innerHTML = '';
    
    // Add "Create new tag" option if input doesn't match any existing tags
    if (!matchingTags.some(tag => tag.toLowerCase() === value)) {
        const newTagItem = document.createElement('div');
        newTagItem.className = 'tag-autocomplete-item';
        newTagItem.textContent = `Create new tag: "${value}"`;
        newTagItem.dataset.isNew = true;
        newTagItem.addEventListener('click', () => {
            selectedTags.add(value);
            updateSelectedTags();
            recipeTagsInput.value = '';
            hideAddRecipeAutocomplete();
        });
        addRecipeTagAutocomplete.appendChild(newTagItem);
    }

    // Add matching existing tags
    matchingTags.forEach((tag, index) => {
        const item = document.createElement('div');
        item.className = 'tag-autocomplete-item';
        item.textContent = tag;
        item.dataset.index = index;
        item.addEventListener('click', () => {
            selectedTags.add(tag);
            updateSelectedTags();
            recipeTagsInput.value = '';
            hideAddRecipeAutocomplete();
        });
        addRecipeTagAutocomplete.appendChild(item);
    });

    addRecipeTagAutocomplete.classList.add('show');
    activeAddRecipeAutocompleteItem = -1;
}

function hideAddRecipeAutocomplete() {
    addRecipeTagAutocomplete.classList.remove('show');
    activeAddRecipeAutocompleteItem = -1;
}

// Handle keyboard navigation in autocomplete
recipeTagsInput.addEventListener('keydown', (e) => {
    const items = addRecipeTagAutocomplete.querySelectorAll('.tag-autocomplete-item');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeAddRecipeAutocompleteItem < items.length - 1) {
            activeAddRecipeAutocompleteItem++;
            updateAddRecipeActiveItem(items);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeAddRecipeAutocompleteItem > 0) {
            activeAddRecipeAutocompleteItem--;
            updateAddRecipeActiveItem(items);
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const value = recipeTagsInput.value.trim();
        if (value) {
            if (activeAddRecipeAutocompleteItem >= 0 && items[activeAddRecipeAutocompleteItem]) {
                // Add selected autocomplete item
                const selectedItem = items[activeAddRecipeAutocompleteItem];
                if (selectedItem.dataset.isNew) {
                    selectedTags.add(value);
                } else {
                    selectedTags.add(selectedItem.textContent);
                }
            } else {
                // Add new tag
                selectedTags.add(value);
            }
            updateSelectedTags();
            recipeTagsInput.value = '';
            hideAddRecipeAutocomplete();
        }
    } else if (e.key === 'Escape') {
        hideAddRecipeAutocomplete();
    }
});

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// Add input event listener for comma-separated tags
recipeTagsInput.addEventListener('input', (e) => {
    const value = e.target.value;
    if (value.endsWith(',')) {
        const tag = capitalizeFirstLetter(value.slice(0, -1).trim());
        if (tag) {
            selectedTags.add(tag);
            updateSelectedTags();
            e.target.value = '';
        }
    } else {
        updateAddRecipeAutocomplete(e.target);
    }
});

function updateAddRecipeActiveItem(items) {
    items.forEach((item, index) => {
        if (index === activeAddRecipeAutocompleteItem) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });
}

// Close autocomplete when clicking outside
document.addEventListener('click', (e) => {
    if (!recipeTagsInput.contains(e.target) && !addRecipeTagAutocomplete.contains(e.target)) {
        hideAddRecipeAutocomplete();
    }
});

// Handle form submission
addRecipeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(addRecipeForm);
    const recipeData = {
        title: formData.get('title'),
        image: formData.get('image'),
        description: formData.get('description'),
        ingredients: formData.get('ingredients').split('\n').filter(ingredient => ingredient.trim()),
        instructions: formData.get('instructions'),
        tags: Array.from(selectedTags)
    };

    try {
        const response = await fetch('/api/recipes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(recipeData)
        });

        if (!response.ok) {
            throw new Error('Failed to add recipe');
        }

        const newRecipe = await response.json();
        recipes.push(newRecipe);
        displayRecipes();
        hideAddRecipeModal();
        selectedTags.clear();
        updateSelectedTags();
    } catch (error) {
        console.error('Error adding recipe:', error);
        alert('Failed to add recipe. Please try again.');
    }
});

// Show Add Recipe Modal
addRecipeButton.addEventListener('click', () => {
    addRecipeModal.classList.add('show');
    document.body.style.overflow = 'hidden';
});

// Hide Add Recipe Modal
function hideAddRecipeModal() {
    addRecipeModal.classList.remove('show');
    document.body.style.overflow = '';
    addRecipeForm.reset();
    hideAddRecipeAutocomplete();
}

// Close Add Recipe Modal
addRecipeClose.addEventListener('click', hideAddRecipeModal);
addRecipeModal.addEventListener('click', (e) => {
    if (e.target === addRecipeModal) {
        hideAddRecipeModal();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (modal.classList.contains('show')) {
            hideModal();
        }
        if (addRecipeModal.classList.contains('show')) {
            hideAddRecipeModal();
        }
    }
});

// Add cancel button event listener
cancelButton.addEventListener('click', () => {
    hideAddRecipeModal();
    selectedTags.clear();
    updateSelectedTags();
});

// Initialize the gallery when the page loads
document.addEventListener('DOMContentLoaded', () => {
    fetchRecipes();
    updateTagFilter();
});

// Tag management
let allTags = new Set();

function updateTagFilter() {
    const tagFilter = document.getElementById('tagFilter');
    tagFilter.innerHTML = '<option value="">All Recipes</option>';
    
    // Collect all unique tags from all recipes
    allTags.clear();
    recipes.forEach(recipe => {
        if (recipe.tags && Array.isArray(recipe.tags)) {
            recipe.tags.forEach(tag => allTags.add(tag));
        }
    });
    
    // Add sorted tags to the filter
    Array.from(allTags).sort().forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagFilter.appendChild(option);
    });
}

function createTagElement(tag) {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag';
    tagElement.textContent = tag;
    return tagElement;
}

function filterRecipesByTag(tag) {
    const recipeCards = document.querySelectorAll('.recipe-card');
    recipeCards.forEach(card => {
        const cardTags = card.dataset.tags ? card.dataset.tags.split(',') : [];
        if (!tag || cardTags.includes(tag)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// Update recipe card creation to include tags
function createRecipeCard(recipe) {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.dataset.tags = recipe.tags ? recipe.tags.join(',') : '';
    
    // Add tags to allTags set
    if (recipe.tags) {
        recipe.tags.forEach(tag => allTags.add(tag));
    }
    
    const isInCart = selectedRecipeIds.has(recipe.id);
    const buttonClass = isInCart ? 'add-to-shopping-list-button in-cart' : 'add-to-shopping-list-button';
    
    card.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.title}" class="recipe-image">
        <div class="recipe-content">
            <h3 class="recipe-title">${recipe.title}</h3>
            <p class="recipe-description">${recipe.description}</p>
            <div class="recipe-tags">
                ${recipe.tags ? recipe.tags.map(tag => 
                    `<span class="tag">${tag}</span>`
                ).join('') : ''}
            </div>
        </div>
        <button class="remove-recipe-button" data-recipe-id="${recipe.id}">×</button>
        <button class="tag-recipe-button" data-recipe-id="${recipe.id}" aria-label="Manage tags">Tag</button>
        <button class="${buttonClass}" data-recipe-id="${recipe.id}" aria-label="Add to cart"></button>
    `;
    
    // Add event listener for shopping list button
    const shoppingListButton = card.querySelector('.add-to-shopping-list-button');
    shoppingListButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectedRecipeIds.has(recipe.id)) {
            removeRecipeFromShoppingList(recipe.id);
        } else {
            addToShoppingList(recipe.id);
        }
    });

    return card;
}

// Add tag filter event listener
document.getElementById('tagFilter').addEventListener('change', (e) => {
    filterRecipesByTag(e.target.value);
});

// Tag Management
let currentRecipeId = null;
const tagModal = document.getElementById('tagModal');
const tagModalTitle = document.getElementById('tagModalTitle');
const currentTagsList = document.getElementById('currentTagsList');
const newTagInput = document.getElementById('newTagInput');
const addTagButton = document.getElementById('addTagButton');
const tagModalClose = tagModal.querySelector('.modal-close');
const tagAutocomplete = document.getElementById('tagAutocomplete');
let activeAutocompleteItem = -1;

// Add close button event listener
tagModalClose.addEventListener('click', hideTagModal);

function showTagModal(recipeId, recipeTitle) {
    currentRecipeId = recipeId;
    tagModalTitle.textContent = `Manage Tags - ${recipeTitle}`;
    updateCurrentTagsList();
    tagModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function hideTagModal() {
    tagModal.classList.remove('show');
    document.body.style.overflow = '';
    currentRecipeId = null;
    newTagInput.value = '';
    hideAutocomplete();
}

function updateCurrentTagsList() {
    const recipe = recipes.find(r => r.id === currentRecipeId);
    if (!recipe) return;

    currentTagsList.innerHTML = '';
    (recipe.tags || []).forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-with-remove';
        tagElement.innerHTML = `
            <span>${capitalizeFirstLetter(tag)}</span>
            <span class="tag-remove" data-tag="${tag}">×</span>
        `;
        currentTagsList.appendChild(tagElement);
    });

    // Add event listeners to remove buttons
    currentTagsList.querySelectorAll('.tag-remove').forEach(removeButton => {
        removeButton.addEventListener('click', async () => {
            const tagToRemove = removeButton.dataset.tag;
            const recipe = recipes.find(r => r.id === currentRecipeId);
            if (recipe) {
                recipe.tags = recipe.tags.filter(t => t !== tagToRemove);
                try {
                    await updateRecipeTags(recipe);
                    updateCurrentTagsList();
                    displayRecipes();
                    updateTagFilter(); // Update tag filter after removing a tag
                } catch (error) {
                    console.error('Error removing tag:', error);
                    alert('Failed to remove tag. Please try again.');
                }
            }
        });
    });
}

// Add tag button event listener
addTagButton.addEventListener('click', async () => {
    const newTag = newTagInput.value.trim();
    if (!newTag) return;

    const recipe = recipes.find(r => r.id === currentRecipeId);
    if (recipe) {
        if (!recipe.tags) recipe.tags = [];
        if (!recipe.tags.includes(newTag)) {
            recipe.tags.push(newTag);
            try {
                await updateRecipeTags(recipe);
                newTagInput.value = '';
                updateCurrentTagsList();
                displayRecipes();
                updateTagFilter(); // Update tag filter after adding a tag
            } catch (error) {
                console.error('Error adding tag:', error);
                alert('Failed to add tag. Please try again.');
            }
        }
    }
});

// Close tag modal when clicking outside or pressing Escape
document.addEventListener('click', (e) => {
    if (e.target === tagModal) {
        hideTagModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tagModal.classList.contains('show')) {
        hideTagModal();
    }
});

async function updateRecipeTags(recipe) {
    try {
        const response = await fetch(`/api/recipes/${recipe.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tags: recipe.tags })
        });

        if (!response.ok) {
            throw new Error('Failed to update recipe tags');
        }
    } catch (error) {
        console.error('Error updating recipe tags:', error);
        throw error;
    }
}

function updateAutocomplete(input) {
    const value = input.value.toLowerCase().trim();
    if (!value) {
        hideAutocomplete();
        return;
    }

    // Get all unique tags from all recipes
    const allTags = new Set();
    recipes.forEach(recipe => {
        if (recipe.tags && Array.isArray(recipe.tags)) {
            recipe.tags.forEach(tag => allTags.add(tag));
        }
    });

    // Filter tags that match the input
    const matchingTags = Array.from(allTags)
        .filter(tag => tag.toLowerCase().includes(value))
        .sort();

    if (matchingTags.length === 0) {
        hideAutocomplete();
        return;
    }

    // Create autocomplete items
    tagAutocomplete.innerHTML = '';
    matchingTags.forEach((tag, index) => {
        const item = document.createElement('div');
        item.className = 'tag-autocomplete-item';
        item.textContent = tag;
        item.dataset.index = index;
        item.addEventListener('click', () => {
            newTagInput.value = tag;
            hideAutocomplete();
        });
        tagAutocomplete.appendChild(item);
    });

    tagAutocomplete.classList.add('show');
    activeAutocompleteItem = -1;
}

function hideAutocomplete() {
    tagAutocomplete.classList.remove('show');
    activeAutocompleteItem = -1;
}

// Add input event listener for autocomplete
newTagInput.addEventListener('input', (e) => {
    updateAutocomplete(e.target);
});

// Handle keyboard navigation in autocomplete
newTagInput.addEventListener('keydown', (e) => {
    const items = tagAutocomplete.querySelectorAll('.tag-autocomplete-item');
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeAutocompleteItem < items.length - 1) {
            activeAutocompleteItem++;
            updateActiveItem(items);
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeAutocompleteItem > 0) {
            activeAutocompleteItem--;
            updateActiveItem(items);
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        const activeItem = items[activeAutocompleteItem];
        if (activeItem) {
            newTagInput.value = activeItem.textContent;
            hideAutocomplete();
        }
    } else if (e.key === 'Escape') {
        hideAutocomplete();
    }
});

function updateActiveItem(items) {
    items.forEach((item, index) => {
        if (index === activeAutocompleteItem) {
            item.classList.add('active');
            item.scrollIntoView({ block: 'nearest' });
        } else {
            item.classList.remove('active');
        }
    });
}

// Shopping List Elements
const shoppingListModal = document.getElementById('shoppingListModal');
const shoppingListButton = document.querySelector('.shopping-list-button');
const shoppingListClose = shoppingListModal.querySelector('.modal-close');
const shoppingListContent = document.getElementById('shoppingListContent');
const selectedRecipesContainer = shoppingListModal.querySelector('.selected-recipes');
let shoppingList = new Set();
let selectedRecipeIds = new Set();

// Show Shopping List Modal
shoppingListButton.addEventListener('click', () => {
    updateShoppingListDisplay();
    shoppingListModal.classList.add('show');
    document.body.style.overflow = 'hidden';
});

// Hide Shopping List Modal
function hideShoppingListModal() {
    shoppingListModal.classList.remove('show');
    document.body.style.overflow = '';
}

// Close Shopping List Modal
shoppingListClose.addEventListener('click', hideShoppingListModal);
shoppingListModal.addEventListener('click', (e) => {
    if (e.target === shoppingListModal) {
        hideShoppingListModal();
    }
});

// Update Shopping List Display
function updateShoppingListDisplay() {
    // Update recipe names
    selectedRecipesContainer.innerHTML = '';
    Array.from(selectedRecipeIds).forEach(recipeId => {
        const recipe = recipes.find(r => r.id === recipeId);
        if (recipe) {
            const recipeTag = document.createElement('div');
            recipeTag.className = 'recipe-name-tag';
            recipeTag.innerHTML = `
                <span>${recipe.title}</span>
                <span class="remove-recipe" data-recipe-id="${recipe.id}">×</span>
            `;
            selectedRecipesContainer.appendChild(recipeTag);

            // Add event listener to remove recipe
            const removeButton = recipeTag.querySelector('.remove-recipe');
            removeButton.addEventListener('click', () => {
                removeRecipeFromShoppingList(recipe.id);
            });
        }
    });

    // Update ingredients list
    const ingredientsList = shoppingListContent.querySelector('.ingredients-list');
    ingredientsList.innerHTML = '';
    
    Array.from(shoppingList).forEach(ingredient => {
        const ingredientItem = document.createElement('div');
        ingredientItem.className = 'ingredient-item';
        ingredientItem.innerHTML = `
            <span>${ingredient}</span>
            <span class="remove-ingredient" data-ingredient="${ingredient}">×</span>
        `;
        ingredientsList.appendChild(ingredientItem);
    });

    // Add event listeners to remove buttons
    ingredientsList.querySelectorAll('.remove-ingredient').forEach(button => {
        button.addEventListener('click', () => {
            const ingredientToRemove = button.dataset.ingredient;
            shoppingList.delete(ingredientToRemove);
            updateShoppingListDisplay();
        });
    });
}

// Update the addToShoppingList function to handle tag capitalization
function addToShoppingList(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe && recipe.ingredients) {
        selectedRecipeIds.add(recipeId);
        recipe.ingredients.forEach(ingredient => {
            shoppingList.add(capitalizeFirstLetter(ingredient));
        });
        updateShoppingListDisplay();
        // Update the button state for this specific recipe
        const button = document.querySelector(`.add-to-shopping-list-button[data-recipe-id="${recipeId}"]`);
        if (button) {
            button.classList.add('in-cart');
        }
    }
}

// Remove Recipe from Shopping List
function removeRecipeFromShoppingList(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe && recipe.ingredients) {
        selectedRecipeIds.delete(recipeId);
        recipe.ingredients.forEach(ingredient => {
            // Only remove the ingredient if it's not used by other selected recipes
            const isUsedByOtherRecipes = Array.from(selectedRecipeIds).some(id => {
                const otherRecipe = recipes.find(r => r.id === id);
                return otherRecipe && otherRecipe.ingredients.includes(ingredient);
            });
            if (!isUsedByOtherRecipes) {
                shoppingList.delete(ingredient);
            }
        });
        updateShoppingListDisplay();
        // Update the button state for this specific recipe
        const button = document.querySelector(`.add-to-shopping-list-button[data-recipe-id="${recipeId}"]`);
        if (button) {
            button.classList.remove('in-cart');
        }
    }
}

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (modal.classList.contains('show')) {
            hideModal();
        }
        if (addRecipeModal.classList.contains('show')) {
            hideAddRecipeModal();
        }
        if (shoppingListModal.classList.contains('show')) {
            hideShoppingListModal();
        }
    }
});

// Update the tag management modal to capitalize tags
function updateTagManagementModal(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const modal = document.getElementById('tagManagementModal');
    const currentTagsContainer = modal.querySelector('.current-tags .tags-list');
    const recipeTags = recipe.tags || [];
    
    currentTagsContainer.innerHTML = '';
    recipeTags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.className = 'tag-with-remove';
        tagElement.innerHTML = `
            <span>${capitalizeFirstLetter(tag)}</span>
            <span class="tag-remove" data-tag="${tag}">×</span>
        `;
        currentTagsContainer.appendChild(tagElement);
    });

    // Add event listeners to remove buttons
    currentTagsContainer.querySelectorAll('.tag-remove').forEach(button => {
        button.addEventListener('click', () => {
            const tagToRemove = button.dataset.tag;
            removeTagFromRecipe(recipeId, tagToRemove);
        });
    });
}

// Update the add tag functionality to capitalize tags
function addTagToRecipe(recipeId, tag) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
        const capitalizedTag = capitalizeFirstLetter(tag);
        if (!recipe.tags) {
            recipe.tags = [];
        }
        if (!recipe.tags.includes(capitalizedTag)) {
            recipe.tags.push(capitalizedTag);
            updateTagManagementModal(recipeId);
            updateTagFilter();
            saveRecipes();
        }
    }
}

// Remove tag from recipe
function removeTagFromRecipe(recipeId, tag) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
        recipe.tags = recipe.tags.filter(t => t !== tag);
        updateTagManagementModal(recipeId);
        updateTagFilter();
        saveRecipes();
    }
}

// Save recipes
function saveRecipes() {
    // Implementation of saveRecipes function
} 