const characterElm = document.querySelector('#character');
const cageElm = document.querySelector('#cage-container');
let startScreen = document.querySelector("#start-screen");
const difficultyLevelElm = document.getElementById('difficulty-level');

const btnFullScreenElm = document.getElementById('full-screen-btn');
const characterHealthContainer = document.getElementById('character-health-container');
const planeHealthContainer = document.getElementById('plane-health-container');
const gameOverElm = document.getElementById('game-over');
const restartInGoElm = document.getElementById('restart-screen');
const ninjaGirl = document.getElementById('ninja-girl');
const gameOverH5Elm = document.querySelector('#game-over > h5');
const levelCompleteElm = document.getElementById('level-complete');
const replayElm = document.getElementById('replay');
const stage1Elm = document.getElementById('stage1');
const stage2Elm = document.getElementById('stage2');
const stage3Elm = document.getElementById('stage3');
const sawElm = document.getElementById('saw');

stage1Elm.style.top = `${(innerHeight / 2) + 165}px`;
stage1Elm.style.left = `${(innerWidth / 3) - 150}px`;

stage2Elm.style.top = `${(innerHeight / 2) + 40}px`;
stage2Elm.style.left = `${(innerWidth / 3) + 20}px`;

stage3Elm.style.top = `${stage2Elm.offsetTop - 150}px`;
stage3Elm.style.left = `${stage1Elm.offsetLeft - stage3Elm.offsetWidth}px`;


// Initial health values
let characterHealth = 100;
let planeHealth = 100;


await new Promise((resolve) => {
    document.querySelector("#start-screen > button")
        .addEventListener('click', async () => {
            await document.querySelector("html").requestFullscreen({
                navigationUI: 'hide'
            });
            if (startScreen) startScreen.remove();
            resolve();
        });
});

await new Promise(function (resolve) {
    const images = ['/image/BG.jpg',
        ...Array(10).fill('/image/character')
            .flatMap((v, i) => [
                `${v}/Jump__00${i}.png`,
                `${v}/Idle__00${i}.png`,
                `${v}/Run__00${i}.png`,
            ])
    ];
    for (const image of images) {
        const img = new Image();
        img.src = image;
        img.addEventListener('load', progress);
    }

    const barElm = document.getElementById('bar');
    const totalImages = images.length;

    function progress() {
        images.pop();
        barElm.style.width = `${100 / totalImages * (totalImages - images.length)}%`
        if (!images.length) {
            setTimeout(() => {
                document.getElementById('overlay').classList.add('hide');
                resolve();
            }, 1000);
        }
    }
});

btnFullScreenElm.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.querySelector("html").requestFullscreen({
            navigationUI: 'hide'
        });
        btnFullScreenElm.classList.add('darken');
    }
});

let dx = 0;                     // Run
let i = 0;                      // Rendering
let t = 0;
let run = false;
let jump = false;
let deadNinja = false;
let angle = 0;
let tmr4Jump;
let tmr4Run;
let previousTouch;
let tmr5render;
let stage_dx1 = 0;
let stage_dx2 = 0;
let stage_dx3 = 0;
let onTile = false;

/* Rendering Function */
tmr5render = setInterval(() => {
    btnFullScreenElm.classList.remove('hide');
    if (document.fullscreenElement) {
        btnFullScreenElm.classList.add('full-screen-btn-darken');
    } else {
        btnFullScreenElm.classList.remove('full-screen-btn-darken');
        btnFullScreenElm.classList.add('full-screen-btn-lighten');
    }

    if (jump) {
        characterElm.style.backgroundImage =
            `url('/image/character/Jump__00${i++}.png')`;
        if (i === 10) i = 0;
    } else if (!run && !deadNinja) {
        characterElm.style.backgroundImage =
            `url('/image/character/Idle__00${i++}.png')`;
        if (i === 10) i = 0;
    } else if (deadNinja) {
        characterElm.style.backgroundImage =
            `url('/image/character/Dead__00${i++}.png')`;
        if (i === 10) clearInterval(tmr5render);

    } else {
        characterElm.style.backgroundImage =
            `url('/image/character/Run__00${i++}.png')`;
        if (i === 10) i = 0;
    }

    characterHealthContainer.style.top = `${characterElm.offsetTop - 10}px`;
    characterHealthContainer.style.left = `${characterElm.offsetLeft - 10}px`;


}, 1000 / 30);

// Initially Fall Down
const floorLocation = outerHeight - 100;
const tmr4InitialFall = setInterval(() => {
    if (cageElm.classList.contains('hide')) cageElm.classList.remove('hide');
    const top = characterElm.offsetTop + (t++ * 0.2);
    if (characterElm.offsetTop >= (floorLocation - characterElm.offsetHeight)) {
        clearInterval(tmr4InitialFall);
        return;
    }
    characterElm.style.top = `${top}px`
}, 20);


function reposition() {
    const tmr4InitialFall = setInterval(() => {
        if (cageElm.classList.contains('hide')) cageElm.classList.remove('hide');
        const top = characterElm.offsetTop + (t++ * 0.2);
        if (characterElm.offsetTop >= (outerHeight - 100 - characterElm.offsetHeight)) {
            clearInterval(tmr4InitialFall);
            return;
        }
        characterElm.style.top = `${top}px`
    }, 20);


}

// Jump
function doJump() {
    if (tmr4Jump) return;
    i = 0;
    jump = true;
    const initialTop = characterElm.offsetTop;
    tmr4Jump = setInterval(() => {
        const top = initialTop - (Math.sin(toRadians(angle)) * 180);
        characterElm.style.top = `${top}px`;
        if (angle === 180 || checkLanding(top)) {
            clearInterval(tmr4Jump);
            tmr4Jump = undefined;
            jump = false;
            angle = 0;
            applyGravity();

        }
        angle++;
    }, 1);
}

function checkLanding(top) {
    if (characterElm.offsetLeft > stage1Elm.offsetLeft && characterElm.offsetLeft < stage1Elm.offsetLeft + stage1Elm.offsetWidth &&
        top >= stage1Elm.offsetTop - characterElm.offsetHeight && top <= stage1Elm.offsetTop + stage1Elm.offsetHeight) {
        characterElm.style.top = `${stage1Elm.offsetTop - characterElm.offsetHeight}px`;
        return true;
    } else if (characterElm.offsetLeft > stage2Elm.offsetLeft && characterElm.offsetLeft < stage2Elm.offsetLeft + stage2Elm.offsetWidth &&
        top >= stage2Elm.offsetTop - characterElm.offsetHeight && top <= stage2Elm.offsetTop + stage2Elm.offsetHeight) {
        characterElm.style.top = `${stage2Elm.offsetTop - characterElm.offsetHeight}px`;
        return true;
    } else if (characterElm.offsetLeft > stage3Elm.offsetLeft && characterElm.offsetLeft < stage3Elm.offsetLeft + stage3Elm.offsetWidth &&
        top >= stage3Elm.offsetTop - characterElm.offsetHeight && top <= stage3Elm.offsetTop + stage3Elm.offsetHeight) {
        characterElm.style.top = `${stage3Elm.offsetTop - characterElm.offsetHeight}px`;
        return true;
    }
    return false;
}

// Utility Fn (Degrees to Radians)
function toRadians(angle) {
    return angle * Math.PI / 180;
}

function applyGravity() {
    if (characterElm.offsetTop >= floorLocation - characterElm.offsetHeight) return;
    const gravityInterval = setInterval(() => {
        if (jump || run || checkLanding(characterElm.offsetTop + 20) )  {  // If jumping, do not apply gravity
            clearInterval(gravityInterval);
            return;
        }
        const top = characterElm.offsetTop + 20;  // Adjust the value for gravity speed
        characterElm.style.top = `${top}px`;
        if (checkLanding(top) || characterElm.offsetTop >= (floorLocation - characterElm.offsetHeight)) {
            clearInterval(gravityInterval);
        }
    }, 20);
}


// Run
function doRun(left) {
    if (tmr4Run) return;
    run = true;
    i = 0;
    if (!checkLanding(characterElm.offsetTop)) applyGravity();

    if (left) {
        dx = -10;
        characterElm.classList.add('rotate');
    } else {
        dx = 10;
        characterElm.classList.remove('rotate');
    }
    tmr4Run = setInterval(() => {
        if (dx === 0) {
            clearInterval(tmr4Run);
            tmr4Run = undefined;
            run = false;
            i = 0;
            return;
        }
        const left = characterElm.offsetLeft + dx;
        if (left + characterElm.offsetWidth >= innerWidth ||
            left <= 0) {
            if (left <= 0) {
                characterElm.style.left = '0';
            } else {
                characterElm.style.left = `${innerWidth - characterElm.offsetWidth - 1}px`
            }
            dx = 0;
            return;
        }
        characterElm.style.left = `${left}px`;
        if (!checkLanding(characterElm.offsetTop)) { // Check landing during run
            applyGravity();
        }
    }, 20);

}

//ninja attack

function throwKnife() {
    const knifeElm = document.createElement('div');
    knifeElm.classList.add('knife');
    document.body.append(knifeElm);

    knifeElm.style.top = `${characterElm.offsetTop + characterElm.offsetHeight / 2}px`;
    knifeElm.style.left = `${characterElm.offsetLeft + characterElm.offsetWidth / 2}px`;

    let knife_dx = 0; // Initialize knife_dx here
    const releaseCharacterX = characterElm.offsetLeft;

    const timeKnife = setInterval(() => {
        // Update knife position
        knife_dx += 30;
        knifeElm.style.left = `${releaseCharacterX + knife_dx}px`;

        // Check if knife has reached the edge of the screen
        if (knifeElm.offsetLeft > innerWidth) {
            clearInterval(timeKnife);
            knifeElm.remove();
        }
        // Check if knife hits the plane
        if (knifeElm.offsetLeft >= planeElm.offsetLeft && knifeElm.offsetTop >= planeElm.offsetTop && knifeElm.offsetTop <= planeElm.offsetTop + planeElm.offsetHeight) {
            clearInterval(timeKnife);
            knifeElm.remove();
            knifeHitPlane();
        }
        if (cageElm.offsetLeft + 20 <= knifeElm.offsetLeft && cageElm.offsetTop + ninjaGirl.offsetTop <= knifeElm.offsetTop && cageElm.offsetTop + ninjaGirl.offsetTop + ninjaGirl.offsetHeight >= knifeElm.offsetTop) {
            gameOver(1);
            knifeElm.remove();
        }


    }, 50);
}

function knifeHitPlane() {
    planeHealth -= 25;
    updateHealthBars();
}


// Event Listeners
addEventListener('keydown', (e) => {
    switch (e.code) {
        case "ArrowLeft":
        case "ArrowRight":
            doRun(e.code === "ArrowLeft");
            break;
        case "Space":
            doJump();
            break;

        case "ShiftRight":
        case "ShiftLeft":
            throwKnife();
    }
});

addEventListener('keyup', (e) => {
    switch (e.code) {
        case "ArrowLeft":
        case "ArrowRight":
            dx = 0;
    }
});

const resizeFn = () => {
    characterElm.style.top = `${outerHeight - 100 - characterElm.offsetHeight}px`;
    if (characterElm.offsetLeft < 0) {
        characterElm.style.left = '0';
    } else if (characterElm.offsetLeft >= innerWidth) {
        characterElm.style.left = `${innerWidth - characterElm.offsetWidth - 1}px`
    }
}

addEventListener('resize', resizeFn);


/* Fix screen orientation issue in mobile devices */
screen.orientation.addEventListener('change', resizeFn);

characterElm.addEventListener('touchmove', (e) => {
    if (!previousTouch) {
        previousTouch = e.touches.item(0);
        return;
    }
    const currentTouch = e.touches.item(0);
    doRun((currentTouch.clientX - previousTouch.clientX) < 0);
    if (currentTouch.clientY < previousTouch.clientY) doJump();
    previousTouch = currentTouch;
});

characterElm.addEventListener('touchend', (e) => {
    previousTouch = null;
    dx = 0;
});

// Plane and Bullet Functionality

let time1 = 0;

const planeElm = document.querySelector('.plane');

let bulletElms = [];
let difficultyLevel = 2;

function updateBullets() {
    bulletElms.forEach(bullet => bullet.remove());
    bulletElms = [];
    for (let j = 0; j < 6; j++) {
        let bullet = document.createElement('div');
        bullet.classList.add('bullet');
        bulletElms.push(bullet);
    }
}

// plane when hit

let planeTimeStamp1;
let planeTimeStamp2;
document.querySelector('#cage')
let cageChange = 0;


function brokenPlane() {

    cageChange += 20;
    bulletElms = [];
    clearInterval(planeTimeStamp1);
    clearInterval(planeTimeStamp2);
    cageElm.style.left = `${planeElm.offsetLeft - 120}px`;

    cageElm.classList.remove('cage-container');
    document.querySelector('#cage').remove();
    cageElm.classList.add('broken-cage');

    const tmrPlaneFall = setInterval(() => {

        const top = planeElm.offsetTop + (time1++ * 0.2);
        if (planeElm.offsetTop >= (innerHeight - planeElm.offsetHeight - 50)) {
            clearInterval(tmrPlaneFall);
            planeElm.style.backgroundImage = 'url("/image/plane/Dead (1).png")';

            setTimeout(() => planeElm.remove(), 4000);
            return;
        }
        planeElm.style.top = `${top}px`;
        cageElm.style.top = `${top - 50}px`;
    }, 20);
}

updateBullets();

planeElm.style.left = `${innerWidth - 150}px`;

// Rendering Plane Animation

let a = 1;
let b = 1;
let c = 1;

planeTimeStamp1 = setInterval(() => {
    if (a < 3) {
        planeElm.style.backgroundImage = `url('/image/plane/Fly (${a++}).png')`;
    } else a = 1;
    if (b < 6) {
        planeElm.style.backgroundImage = `url('/image/plane/Shoot (${b++}).png')`;
    } else b = 1;


}, 1000 / 30);

let plane_dy = 0;
let planeY;

planeTimeStamp2 = setInterval(() => {
    plane_dy += Math.random() * 20 * c;
    if (planeElm.offsetTop < (innerHeight - 220) && planeElm.offsetTop > 50) {
        planeElm.style.top = `${plane_dy}px`;
    } else if (planeElm.offsetTop < 50) {
        c = 1;
        planeElm.style.top = `${plane_dy}px`
    } else {
        c = -1;
        planeElm.style.top = `${plane_dy}px`;
    }

    cageElm.style.left = `${planeElm.offsetLeft + 15}px`;
    cageElm.style.top = `${planeElm.offsetTop + planeElm.offsetHeight - 20}px`;
    planeY = planeElm.offsetTop;

    planeHealthContainer.style.top = `${planeElm.offsetTop - 10}px`;
    planeHealthContainer.style.left = `${planeElm.offsetLeft + 100}px`;


}, 50);


// Bullet Shooting Mechanism and difficulty level adjustment

let bullet_dx = 20;
let bullets = 0;
let time = 1000;
let timeId;
bulletShoot();

document.getElementById('minus').addEventListener('click', () => {
    console.log("minus")
    if (difficultyLevel > 1) {
        time += 500;
        clearInterval(timeId);
        bulletShoot();
    }
});

document.getElementById('plus').addEventListener('click', () => {
    console.log("plus")
    if (difficultyLevel < 3) {
        time -= 500;
        clearInterval(timeId);
        bulletShoot();
    }
});

setInterval(() => {
    difficultyLevel = (time === 1500) ? 1 : (time === 1000) ? 2 : 3;
    difficultyLevelElm.innerText = (difficultyLevel === 1) ? "Easy" : (difficultyLevel === 2) ? "Medium" : "Hard";

}, 50);

function bulletShoot() {

    timeId = setInterval(() => {
        bullet_dx = 20;
        if (bullets >= bulletElms.length) {
            bullets = 0;
        }

        let bullet = bulletElms[bullets++];
        bullet.style.top = `${planeElm.offsetTop + planeElm.offsetHeight / 2}px`;
        bullet.style.left = `${planeElm.offsetLeft}px`;
        document.body.append(bullet);

        let bulletInterval = setInterval(() => {
            if (bullet.offsetLeft > 0) {
                bullet.style.left = `${bullet.offsetLeft - bullet_dx}px`;
                bullet_dx += 1;

                // Check if bullet hits the character -collision detection
                if (bullet.offsetLeft <= characterElm.offsetLeft + characterElm.offsetWidth &&
                    bullet.offsetLeft >= characterElm.offsetLeft &&
                    bullet.offsetTop >= (characterElm.offsetTop) &&
                    bullet.offsetTop <= characterElm.offsetTop + characterElm.offsetHeight) {
                    clearInterval(bulletInterval);
                    bullet.remove();
                    bulletHitCharacter();
                }
            } else if (characterElm.offsetLeft + characterElm.offsetWidth >= planeElm.offsetLeft && characterElm.offsetTop <= (planeElm.offsetTop + planeElm.offsetHeight + cageElm.offsetHeight)) {
                bullet.remove();
                bulletHitCharacter();
            } else {
                bullet.remove();
                clearInterval(bulletInterval);
            }
        }, 20);

    }, time);
}

let bulletHits = 0;

function bulletHitCharacter() {
    bulletHits++;
    characterHealth -= 20; // Decrease character health
    updateHealthBars();
    if (bulletHits < 5) {


    } else {

    }
}

document.getElementById('exit').addEventListener('click', () => {
    location.reload();
});
document.getElementById('restart').addEventListener('click', () => {
    location.reload();
});
replayElm.addEventListener('click', () => {
    location.reload();
});

// Function to update health bars
function updateHealthBars() {
    const characterHealthBar = document.getElementById('character-health-bar');
    const planeHealthBar = document.getElementById('plane-health-bar');

    characterHealthBar.style.width = `${characterHealth}%`;
    planeHealthBar.style.width = `${planeHealth}%`;

    if (characterHealth <= 0) {
        deadNinja = true;
        characterHealthContainer.classList.add('hide');
        gameOver(0);
    }
    if (planeHealth <= 0) {
        brokenPlane();
        planeHealthContainer.classList.add('hide');
        levelCompleteElm.classList.remove('hide');
    }
}



//saw
sawElm.classList.remove('hide');
const left = (innerWidth - sawElm.offsetWidth) * Math.random();
const top = (innerHeight - sawElm.offsetHeight) * Math.random();
sawElm.style.left = `${left}px`;
sawElm.style.top = `${top}px`;


let saw_dx = 5 + Math.random() * (Math.random() > 0.5 ? 1 : -1);
let saw_dy = 5 + Math.random() * (Math.random() > 0.5 ? 1 : -1);

setInterval(() => {

    const left = sawElm.offsetLeft + saw_dx;
    const top = sawElm.offsetTop + saw_dy;
    if (top + sawElm.offsetHeight >= innerHeight || top <= 0) {
        saw_dy = -saw_dy;
        return;
    }
    if (left + sawElm.offsetWidth >= innerWidth || left <= 0) {
        saw_dx = -saw_dx;
        return;
    }
    sawElm.style.left = `${left}px`;
    sawElm.style.top = `${top}px`;

    if (sawElm.offsetLeft <= characterElm.offsetLeft + characterElm.offsetWidth &&
        sawElm.offsetLeft >= characterElm.offsetLeft &&
        sawElm.offsetTop >= (characterElm.offsetTop) &&
        sawElm.offsetTop <= characterElm.offsetTop + characterElm.offsetHeight) {
        gameOver(0);
        deadNinja = true;
        sawElm.remove();
    }

    },10);

function gameOver(reason) {
    let text = "";
    bulletElms = [];
    clearInterval(planeTimeStamp2);
    switch (reason) {
        case 0 :
            text = "You are Dead";
            break;
        case 1:
            text = "The Ninja Girl is Dead";
    }

    gameOverH5Elm.innerText = text;
    gameOverElm.classList.remove('hide');
    characterHealthContainer.classList.add('hide');
}

restartInGoElm.addEventListener('click', () => {
    location.reload();
});



