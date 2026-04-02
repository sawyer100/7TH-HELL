
# will update later but like, right now it's just how this works so far, as i understand it

im using react and vite/phaser. React renders over the phaser game for things like menu items and GUI and etc., so like an inventory button is actually a react comp rendered over the phaser game. The phaser game is inside the game container which is rendered under the react components. Phaser handesl things like the game world, character movement and logic and etc. Basically, the actual game is phaser inside a container, adn React is rendering as SOME of the GUI elements over the game container, so it looks like it's part of one game.

## react / react css

src/app.jsx is the screen containing things to be rendered over the game container.
src/ui.jsx initiates app.jsx, and, ui.jsx is imported into src/main.js imports ui.jsx and puts it on the page when we run
src/ui.css is the CSS for the REACT part of the page, but style.css inside public is the global css, so dont like, reuse selectors that collide between the 2 CSS pages, try to keep react css inside ui.css so it's easier to manage.

## src/main.js vs src/game/main.js

src/main.js starts the actual game inside the game container, but src/game/main.js creates what the game's world should look like, including configs that set, the game size, the scene, and puts the things from /scenes into the game. Basically src/main.js mounts the actual game from src/game/main.js, just like how src/ui.jsx mounts the app.jsx into the page.

### src/game/main.js

in this main.js it returns `return new Game({ ...config, parent });`, that's what u get from the exportable StartGame function, basically we import it inside src/main.js and, create the phaser game with the config from src/game/main.js. Phaser creates a canvas from the new Game, that's attached to game container. every game, is an instance

## index.html

the id #game-container, phaser game goes into here after its added by src/main.js
the id #ui-root, react goes into this after added by ui.jsx

## scenes

inside src/game/main.js you will see scenes: []. Any scene that you want to play, in the game, you have to put inside the []. And they have to be a scene, so for a new scene, import scene at the top of the file so we can create it as a scene. And then in the main.js, import the .js file that you created the scene inside.
