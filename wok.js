class Wok {
    constructor() {
        this.ui = new UI(this)
        this.cookbook = {}
        this.recipeEdited = false
        this.recipe = undefined
        this.userFormData = null
        this.chef = { cursor: 0, progress: 0 }
    }

    // TODO: Cookbook?
    fillCookbook() {
        this.ui.clearCookbook()
        fetch("cookbook.json", { cache: "no-cache" }).then(res => res.json().then(cookbook => {
            this.cookbook = cookbook
            for (let recipe in this.cookbook) {
                this.ui.addRecipe(recipe,
                    this.getScore(recipe) / this.cookbook[recipe]["ingredients"].length)
            }
            this.recipeChanged()
        }))
    }

    recipeChanged() {
        this.recipe = this.ui.getActiveRecipe()
    }

    // TODO: Cooker?
    updateProgress() {
        this.ui.displayProgress(this.chef.progress / this.cookbook[this.recipe]["ingredients"].length)
    }

    // TODO: Cooker?
    cook() {
        if (this.cookbook[this.recipe]["ingredients"].length) {
            this.chef.progress = 0
            this.shuffleIngredients()
            this.updateProgress()
            this.ui.showKitchen()
            this.nextIngredient()
        }
    }

    // TODO: Cooker?
    shuffleIngredients() {
        this.chef.cursor = 0
        const ingredients = this.cookbook[this.recipe]["ingredients"]
        ingredients.sort(() => Math.random() - 0.5)
    }

    // TODO: Cooker?
    evaluate(answer) {
        const recipe = this.cookbook[this.recipe]
        const ingredient = recipe["ingredients"][this.chef.cursor]
        if (ingredient[0].includes(answer) !== ingredient[1].includes(answer)) {
            if (!ingredient[2]) {
                this.chef.progress = Math.min(this.chef.progress + 1, recipe["ingredients"].length)
                ingredient[2] = true
                this.updateProgress()
            }
        } else {
            this.ui.wrongAnswer(JSON.stringify(ingredient))
            if (ingredient[2]) {
                this.chef.progress = Math.max(this.chef.progress - 1, 0)
                ingredient[2] = false
                this.updateProgress()
            }
        }
        this.chef.cursor++
        if (this.chef.cursor === recipe["ingredients"].length) {
            this.shuffleIngredients()
        }
        this.nextIngredient()
    }

    // TODO: Cooker?
    nextIngredient() {
        this.ui.showIngredient(randomElement(
            this.cookbook[this.recipe]["ingredients"][this.chef.cursor][Number(Math.random() < 0.5)]))
    }

    // TODO: Cooker?
    serve() {
        this.cookbook[this.recipe]["ingredients"].forEach((e, i, a) => e[2] !== undefined && a[i].pop())
        this.ui.serve()
        this.userFormData.append("save", this.recipe)
        this.userFormData.append("score", Math.max(this.chef.progress, this.getScore()))
        fetch("wok.php", { method: "post", body: this.userFormData }).then(r => this.fillCookbook())
        this.userFormData.delete("save")
        this.userFormData.delete("score")
    }

    authenticate(callback, failureCallback) {
        fetch("wok.php", { method: "post", body: this.userFormData })
            .then(res => res.json().then(json => json ? callback() : failureCallback(json)))
    }

    requestLogin(data) {
        if (this.userFormData && formDataToString(this.userFormData) == formDataToString(data)) {
            data.append("create", "")
        }
        this.userFormData = data
        this.authenticate(() => { this.ui.showCookbook() },
            res => { res == null ? this.ui.wrongUsername() : this.ui.wrongPassword() })
        this.userFormData.delete("create")
    }

    // TODO: Cookbook?
    getScore(recipe) {
        return Number(this.cookbook[recipe || this.recipe]["score"][this.userFormData.get("username")] || 0)
    }

    addIngredient(submitter, newPairs) {
        const ingredients = this.cookbook[this.recipe]["ingredients"]
        newPairs.forEach(newPair => {
            let pairFound = false
            if (!newPair[0] || !newPair[1]) {
                return
            }
            ingredients.forEach((ingredient, i) => {
                ingredient.forEach((set, j) => {
                    newPair.forEach((element, k) => {
                        if (set.includes(element)) {
                            pairFound = true
                            if (!ingredient[Number(!j)].includes(newPair[Number(!k)])) {
                                ingredients[i][Number(!j)].push(newPair[Number(!k)])
                                this.recipeEdited = true
                            }
                        }
                    })
                })
            })
            if (!pairFound) {
                ingredients.push([[newPair[0]], [newPair[1]]])
                this.recipeEdited = true
            }
        })
        if (submitter === "save") {
            if (this.recipeEdited) {
                this.recipeEdited = false
                this.userFormData.append("save", this.recipe)
                this.userFormData.append("ingredients", JSON.stringify(ingredients))
                fetch("wok.php", { method: "post", body: this.userFormData }).then(r => this.fillCookbook())
                this.userFormData.delete("save")
                this.userFormData.delete("ingredients")
            } else {
                this.fillCookbook()
            }
        }
        this.ui.setAddFormActive(submitter === "add")
    }

    newRecipe(name) {
        if (!name) {
            this.ui.enableRecipeNameInput()
        } else {
            this.ui.setAddRecipeFormActive(true)
            this.userFormData.append("save", name)
            fetch("wok.php", { method: "post", body: this.userFormData }).then(r => this.fillCookbook())
            this.userFormData.delete("save")
        }
    }
}

function randomElement(array) {
    return array[Math.floor(Math.random() * array.length)]
}

function formDataToString(fd) {
    JSON.stringify(fd && [...fd.entries()])
}

class Cooker { }

class UI {
    constructor(wok) {
        this.nodes =
        {
            login: document.getElementById("login"),
            loginForm: document.getElementById("loginForm"),
            username: loginForm["username"],
            password: loginForm["password"],
            loginButton: document.getElementById("loginButton"),
            accountMessage: document.getElementById("accountMessage"),
            cookbook: document.getElementById("cookbook"),
            recipes: document.getElementById("recipes"),
            addRecipeForm: document.getElementById("addRecipeForm"),
            cookButton: document.getElementById("cookButton"),
            addIngredientsButton: document.getElementById("addIngredientsButton"),
            addIngredientsForm: document.getElementById("addIngredientsForm"),
            textareaSwitch: document.getElementById("textarea"),
            addIngredientsList: document.getElementById("addIngredientsList"),
            kitchen: document.getElementById("kitchen"),
            ingredient: document.getElementById("ingredient"),
            answerForm: document.getElementById("answerForm"),
            answerButton: document.getElementById("answerButton"),
            progress: document.getElementById("progress"),
            serveButton: document.getElementById("serveButton"),
        }

        this.wok = wok

        this.nodes.login.hidden = false
        this.nodes.kitchen.hidden = true
        this.nodes.cookbook.hidden = true
        this.nodes.accountMessage.hidden = true

        this.nodes.recipes.onchange = () => this.wok.recipeChanged()
        this.nodes.recipes.disabled = false
        this.nodes.cookButton.onclick = () => this.wok.cook()
        this.nodes.cookButton.disabled = false
        this.nodes.loginButton.onclick = this.onLoginRequested()
        this.nodes.answerButton.onclick = this.onAnswer()
        this.nodes.serveButton.onclick = () => this.wok.serve()
        this.nodes.addIngredientsButton.onclick = () => this.setAddFormActive(true)
        this.nodes.textareaSwitch.onchange = () => this.toggleTextarea()
        this.nodes.addRecipeForm[1].onclick = e => { this.onAddRecipe(e) }

        this.setAddFormActive(false)
        this.setAddRecipeFormActive(true)
        this.nodes.addIngredientsForm.onsubmit = e => { this.onAdd(e) }

        this.resetLoginForm()
    }

    clearCookbook() {
        this.nodes.recipes.innerHTML = "<option disabled hidden value=\"\">select recipe</option>"
        this.nodes.recipes.selectedIndex = 0
    }

    addRecipe(recipe, score) {
        const scoreString = score > 0 ? " (" + (100 * score).toFixed() + "%)" : ""
        const option = document.createElement("option")
        option.text = (option.value = recipe) + scoreString
        this.nodes.recipes.add(option)
    }

    getActiveRecipe() {
        return this.nodes.recipes.value
    }

    displayProgress(progress) {
        this.nodes.progress.innerHTML = (100 * progress).toFixed() + "%"
    }

    showIngredient(ingredient) {
        this.nodes.answerForm.reset()
        this.nodes.ingredient.innerHTML = ingredient
    }

    showCookbook() {
        this.nodes.login.hidden = true
        this.nodes.cookbook.hidden = false
        this.wok.fillCookbook()
    }

    showKitchen() {
        this.nodes.kitchen.hidden = false
        this.setCookbookDisbabled(true)
        this.nodes.answerForm.reset()
    }

    serve() {
        alert("The chef is " + this.nodes.progress.innerHTML + " satisfied!")
        this.nodes.kitchen.hidden = true
        this.setCookbookDisbabled(false)
    }

    setCookbookDisbabled(value) {
        this.nodes.recipes.disabled = value
        this.nodes.cookButton.disabled = value
        this.nodes.addIngredientsButton.disabled = value
        this.setAddRecipeFormActive(!value)
    }

    onLoginRequested() {
        return event => {
            event.preventDefault()
            const data = new FormData(this.nodes.loginForm)
            const hasher = jsSHA("SHA-1", "TEXT", { encoding: "UTF8" })
            hasher.update(data.get("password"))
            data.set("password", hasher.getHash("HEX"))
            this.wok.requestLogin(data)
        }
    }

    onAnswer() {
        return event => {
            event.preventDefault()
            this.wok.evaluate(this.nodes.answerForm["answer"].value)
        }
    }

    onAdd(e) {
        e.preventDefault()
        const ingredients = []
        if (this.nodes.textareaSwitch.checked) {
            this.nodes.addIngredientsList.value.match(/(.+;.+\r?\n)*(.+;.+)/g)[0]
                .split(/\r?\n/).forEach(i => {
                    ingredients.push(i.split(";", 2))
                })
        } else {
            ingredients.push([this.nodes.addIngredientsForm[0].value, this.nodes.addIngredientsForm[1].value])
        }
        this.wok.addIngredient(e.submitter.value, ingredients)
    }

    onAddRecipe(e) {
        e.preventDefault()
        this.wok.newRecipe(this.nodes.addRecipeForm[0].value)
    }

    wrongAnswer(string) {
        alert("Oops, the chef is not that happy...\n" + string)
    }

    wrongPassword() {
        this.nodes.password.setCustomValidity("wrong password")
        this.resetLoginForm()
    }

    wrongUsername() {
        this.nodes.accountMessage.hidden = false
        this.resetLoginForm()
    }

    toggleTextarea(value) {
        if (value === undefined) {
            value = this.nodes.textareaSwitch.checked
        }
        this.nodes.addIngredientsList.hidden = this.nodes.addIngredientsList.disabled = !value
        this.nodes.addIngredientsForm[0].disabled = this.nodes.addIngredientsForm[1].disabled = value
    }

    resetLoginForm() {
        this.nodes.loginForm.reset()
        this.nodes.username.focus()
    }

    setAddFormActive(value) {
        if (value && !this.nodes.recipes.value) {
            return
        }
        this.nodes.addIngredientsButton.disabled = value
        this.nodes.addIngredientsForm.hidden = !value
        this.nodes.cookButton.disabled = value
        this.nodes.recipes.disabled = value
        this.setAddRecipeFormActive(!value)
        this.toggleTextarea(false)
        if (value) {
            this.nodes.addIngredientsForm.reset()
            this.nodes.addIngredientsForm[0].focus()
        }
    }

    setAddRecipeFormActive(value) {
        this.nodes.addRecipeForm[0].hidden = true
        this.nodes.addRecipeForm[0].value = ""
        this.nodes.addRecipeForm[1].disabled = !value
    }

    enableRecipeNameInput() {
        this.nodes.addRecipeForm[0].hidden = false
        this.nodes.addRecipeForm[0].focus()
    }
}
