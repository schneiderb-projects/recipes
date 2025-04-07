from flask import Flask, jsonify, render_template, request
import json
import os

app = Flask(__name__)

# File path for storing recipes
RECIPES_FILE = 'recipes.json'

def load_recipes():
    """Load recipes from JSON file"""
    if os.path.exists(RECIPES_FILE):
        with open(RECIPES_FILE, 'r') as f:
            return json.load(f)
    return []

def save_recipes(recipes):
    """Save recipes to JSON file"""
    with open(RECIPES_FILE, 'w') as f:
        json.dump(recipes, f, indent=4)

# Load initial recipes
recipes = load_recipes()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/recipes')
def get_recipes():
    return jsonify(recipes)

@app.route('/api/recipes', methods=['POST'])
def add_recipe():
    try:
        data = request.get_json()
        new_id = max([recipe['id'] for recipe in recipes], default=0) + 1
        
        new_recipe = {
            'id': new_id,
            'title': data['title'],
            'image': data['image'],
            'description': data['description'],
            'ingredients': data['ingredients'],
            'instructions': data['instructions'],
            'tags': data.get('tags', [])  # Get tags from request, default to empty list
        }
        
        recipes.append(new_recipe)
        save_recipes(recipes)
        return jsonify(new_recipe), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recipes/<int:recipe_id>', methods=['DELETE'])
def delete_recipe(recipe_id):
    try:
        # Find the recipe with the given ID
        recipe_index = next((index for (index, recipe) in enumerate(recipes) if recipe['id'] == recipe_id), None)
        
        if recipe_index is None:
            return jsonify({'error': 'Recipe not found'}), 404
        
        # Remove the recipe
        del recipes[recipe_index]
        save_recipes(recipes)
        
        return jsonify({'message': 'Recipe deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recipes/<int:recipe_id>', methods=['PATCH'])
def update_recipe_tags(recipe_id):
    try:
        data = request.get_json()
        recipe = next((r for r in recipes if r['id'] == recipe_id), None)
        
        if not recipe:
            return jsonify({'error': 'Recipe not found'}), 404
        
        if 'tags' in data:
            recipe['tags'] = data['tags']
            save_recipes(recipes)
        
        return jsonify(recipe)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000) 