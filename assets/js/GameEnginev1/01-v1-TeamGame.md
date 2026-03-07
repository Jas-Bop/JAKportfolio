---
layout: opencs
title: RPG Water Example 
permalink: /gamify/Teamsgame
---

<div id="gameContainer">
    <div id="promptDropDown" class="promptDropDown" style="z-index: 9999"></div>
    <!-- GameEnv will create canvas dynamically -->
</div>

<script type="module">
    // Adnventure Game assets locations
    import Core from "{{site.baseurl}}/assets/js/GameEnginev1/essentials/Game.js";
    import GameControl from "{{site.baseurl}}/assets/js/GameEnginev1/essentials/GameControl.js";
    import GameLevelKirby from "{{site.baseurl}}/assets/js/GameEnginev1/GameLevelKirby.js";
    import GameLevelAstronautGame from "{{site.baseurl}}/assets/js/GameEnginev1/GameLevelAstronautGame.js";
    import GameLevelSlime from "{{site.baseurl}}/assets/js/GameEnginev1/GameLevelSlime.js";
    import GameLevelEpilogue from "{{site.baseurl}}/assets/js/GameEnginev1/GameLevelEpilogue.js";
    import GameLevelPrologue from "{{site.baseurl}}/assets/js/GameEnginev1/GameLevelPrologue.js";


    import { pythonURI, javaURI, fetchOptions } from '{{site.baseurl}}/assets/js/api/config.js';

    const gameLevelClasses = [GameLevelPrologue, GameLevelKirby, GameLevelAstronautGame, GameLevelSlime, GameLevelEpilogue];

    // Web Server Environment data
    const environment = {
        path:"{{site.baseurl}}",
        pythonURI: pythonURI,
        javaURI: javaURI,
        fetchOptions: fetchOptions,
        gameContainer: document.getElementById("gameContainer"),
        gameLevelClasses: gameLevelClasses

    }
    // Launch Adventure Game using the central core and adventure GameControl
    Core.main(environment, GameControl);
</script>
