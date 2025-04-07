import { fetchAllRecipes } from "@/API/recipes";
import { Recipe, PaginationState } from "@/types/types";

// Transform Drupal data to Recipe type
function drupalNodeToRecipe(node: any): Recipe {
  return {
    id: node.id,
    title: node.attributes.title,
    summary: node.attributes.field_summary.value || "",
    image: 'https://recipes.ddev.site' + node.field_recipe_image.field_media_image.uri.url || "/placeholder.svg",
    cookingTime: node.attributes.field_cooking_time || 0,
    difficulty: node.attributes.field_difficulty || "Easy",
    ingredients: node.attributes.field_ingredients || [],
    instructions: node.attributes.field_instructions.value || [], // NEEDS TO BE FIXED
    category: node.attributes.field_recipe_category || "",
    featured: node.attributes.field_featured || false,
    path: node.attributes.path.alias || "",
  };
}

// Service for Drupal data fetching
export const drupalService = {
  /**
   * Fetch all recipes with pagination
   */
  getAllRecipes: async (
    page = 1,
    pageSize = 9
  ): Promise<{ recipes: Recipe[]; pagination: PaginationState }> => {
    try {
      // const response: Recipe[] = await drupal.getResourceCollection('node--recipe', {
      //   params: {
      //     include: "field_recipe_image.field_media_image",
      //     "fields[media--image]": "field_media_image",
      //     "fields[file--file]": "uri",
      //     "page[limit]": pageSize,
      //     "page[offset]": (page - 1) * pageSize,
      //     sort: "-created"
      //   }
      // })
      const response = await fetchAllRecipes(page, pageSize);
    
      console.log("🚀 ~ recipes:", response.data)
      const recipes = response.data.map((node: any) => drupalNodeToRecipe(node))

      return {
        recipes: recipes,
        pagination: {
          currentPage: page,
          totalPages: 5, // Mock total pages
          pageSize: pageSize,
          totalItems: 45, // Mock total items
        },
      };
    } catch (error) {
      console.error("Error fetching recipes:", error);
      throw new Error("Failed to fetch recipes");
    }
  },

  /**
   * Fetch featured recipes
   */
  getFeaturedRecipes: async (): Promise<Recipe[]> => {
    try {
      // TODO: Replace with actual Drupal API call
      // This would use NextDrupal client to fetch featured recipes
      // const { data } = await drupalClient.getResourceCollection('node--recipe', {
      //   params: {
      //     filter: {
      //       featured: {
      //         value: true
      //       }
      //     },
      //     sort: '-created',
      //     'page[limit]': 6
      //   }
      // })

      // For now, return mock data
      const mockFeaturedRecipes: Recipe[] = [
        {
          id: "1",
          title: "Spaghetti Carbonara",
          summary: "Classic Italian pasta dish with eggs, cheese, and pancetta",
          image: "/images/carbonara.jpg",
          cookingTime: 30,
          difficulty: "Medium",
          reviews: 42,
          description: "A delicious traditional Italian pasta dish from Rome.",
          ingredients: [
            "Spaghetti",
            "Eggs",
            "Pancetta",
            "Parmesan cheese",
            "Black pepper",
          ],
          instructions: [
            "Boil pasta",
            "Cook pancetta",
            "Mix eggs and cheese",
            "Combine and serve",
          ],
          category: "dinner",
          featured: true,
        },
        // More mock featured recipes would be here
      ];

      return mockFeaturedRecipes;
    } catch (error) {
      console.error("Error fetching featured recipes:", error);
      throw new Error("Failed to fetch featured recipes");
    }
  },

  /**
   * Get a single recipe by ID
   */
  getRecipeById: async (id: string): Promise<Recipe | null> => {
    try {
      // TODO: Replace with actual Drupal API call
      // This would use NextDrupal client to fetch a single recipe
      // const recipe = await drupalClient.getResource('node--recipe', id)

      // For now, return mock data based on ID
      if (id === "1") {
        return {
          id: "1",
          title: "Spaghetti Carbonara",
          summary: "Classic Italian pasta dish with eggs, cheese, and pancetta",
          image: "/images/carbonara.jpg",
          cookingTime: 30,
          difficulty: "Medium",
          reviews: 42,
          description: "A delicious traditional Italian pasta dish from Rome.",
          ingredients: [
            "Spaghetti",
            "Eggs",
            "Pancetta",
            "Parmesan cheese",
            "Black pepper",
          ],
          instructions: [
            "Boil pasta",
            "Cook pancetta",
            "Mix eggs and cheese",
            "Combine and serve",
          ],
          category: "dinner",
          featured: true,
        };
      }

      return null;
    } catch (error) {
      console.error(`Error fetching recipe with ID ${id}:`, error);
      throw new Error("Failed to fetch recipe");
    }
  },
};
