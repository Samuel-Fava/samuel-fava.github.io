
let py = 8;
let a = 0;
let open1 = false;
let yellow = false;
let game = 'start';
let result = [];
let final = [];
let balls = [];
let startPos = [];
let model = null;
let tmpTxt = [];
let breakDeterminism = true;
let text = null;
let debounceTimeout;

let colors = [];
for (let i = 0; i < 100; i++) {
    const hue = (i * 137.5) % 360; // Use golden angle to distribute colors evenly
    colors.push(`hsl(${hue}, 70%, 50%)`); // Generate HSL colors
}

let export_balls = parseInt(document.getElementById("export_balls").value, 10) || 0;
let import_balls = parseInt(document.getElementById("import_balls").value, 10) || 0;

document.getElementById('myModal').addEventListener('hidden.bs.modal', () => {
    document.body.focus(); // Move focus to the body
});

function clearCookies() {
    document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim();
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    });
}
function clearLocalStorage() {
    localStorage.clear();
}
function clearSessionStorage() {
    sessionStorage.clear();
}
function reloadAssets() {
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
        const src = img.src.split('?')[0];
        img.src = `${src}?t=${new Date().getTime()}`; // Add a timestamp to bypass the cache
    });
}

function startGame() {
    // Parse and validate the input values
    const importBalls = parseInt(document.getElementById('import_balls').value, 10);
    const exportBalls = parseInt(document.getElementById('export_balls').value, 10);

    // Check if the input values are valid numbers
    if (isNaN(importBalls) || isNaN(exportBalls)) {
        alert('Please fill in all fields with valid numbers.');
        resetSettings(); // Reset the settings
        return;
    }

    // Check if the exportBalls value exceeds importBalls
    if (exportBalls > importBalls) {
        alert('Invalid settings. Machine will not work.');
        return; // Stop further execution
    }

    // If all validations pass, start the game
    console.log('Starting the game...');
    document.getElementById('controlpan').style.display = 'none';
    Main.start({
        type: 'PHYSX', // Specify the physics engine
        useWebgpu: false // Enable or disable WebGPU rendering
    });

    // Manually hide the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('myModal'));
    if (modal) {
        modal.hide();
    } else {
        console.error('Modal instance not found.');
    }
}
function applySettings() {
    const importBalls = document.getElementById('import_balls').value;
    const exportBalls = document.getElementById('export_balls').value;

    window.import_balls = parseInt(importBalls, 10);
    window.export_balls = parseInt(exportBalls, 10);
}
window.applySettings = applySettings;

function resetSettings() {
    document.getElementById('import_balls').value = '';
    document.getElementById('export_balls').value = '';

    window.import_balls = 0;
    window.export_balls = 0;
}

function handleClick() {
    if (debounceTimeout) return;
    debounceTimeout = setTimeout(() => {
        applySettings();       // Apply the settings
        onReset();             // Reset textures and settings
        replay();              // Restart the game
        clearCookies();        // Optional: Clear cookies
        clearLocalStorage();   // Optional: Clear local storage
        reloadAssets();        // Optional: Reload cached assets
        debounceTimeout = null;
    }, 444); // Adjust the delay as needed
}

//////////////////////////////////////////////////////////

let tmpCanvas = document.createElement('canvas')
tmpCanvas.width = tmpCanvas.height = 128

let bigCanvas = document.createElement('canvas')
bigCanvas.width = bigCanvas.height = 128 * 10

demo = () => {
    phy.log('SPACE to restart');

    // Set a fixed camera view
    phy.view({
        envmap: 'beach', // Environment map
        envblur: 1.0,    // Blur level for the environment
        phi: -10,        // Horizontal rotation
        theta: -18,      // Vertical rotation
        distance: 14,    // Distance from the target
        x: 2, y: 4.6, z: 2.7, // Target position
        fov: 44,         // Field of view
        mouse: false     // Disable mouse interaction (if supported)
    });

    // Explicitly block mouse events on the canvas??
    const canvas = document.querySelector('canvas'); // Select the canvas element
    if (canvas) {
        canvas.style.pointerEvents = 'none'; // Disable all pointer events on the canvas
    }

    // Setting and start
    phy.set({
        substep: engine === 'OIMO' || engine === 'AMMO' ? 8 : 1,
        gravity: [0, -9.81, 0],
        determinism: false,
        ccd: true,
    });

    // Add static ground
    phy.add({ type: 'plane', size: [300, 1, 300], visible: true });

    // Load models and start the simulation
    phy.load(['./assets/models/million.glb'], () => {
        onComplete();
        replay(); // Call replay only after onComplete finishes
    });
};

onComplete = () => {
    model = phy.getMesh('million');
    makeMachine();
    makeBall();
    text = phy.addText({
        text: 'Lottery Game',
        color: '#606010',
        pos: [0.15, 0.5, 4.0],
        rot: [-90, 0, 0]
    });
    phy.setTimeout(activeBall, 3000);
};

activeBall = () => {
    let i = balls.length, r = [];
    while (i--) {
        r.push({ name: balls[i].name, wake: true })
    }
    phy.change(r)
    phy.setTimeout(startSimulation, 3000)
}

replay = () => {
    // Stop any ongoing updates
    phy.setPostUpdate(null);
    game = 'start';
    // Reset the text object if it exists
    if (text) {
        text.set('Rolly Game'); // Update the text only if it exists
    } else {
        console.warn('Text object is not initialized.');
    }
    // Reset variables
    a = 0;
    yellow = false;
    open1 = false;
    // Reset objects
    let r = [
        { name: 'L_pale1', rot: [0, 0, a + 45], reset: true },
        { name: 'L_pale2', rot: [0, 0, -a], reset: true },
        { name: 'block1', pos: [0, -4.87 + py, open1 ? -1 : 0] },
    ];

    result = [];
    final = [];
    onReset(); // Call onReset here
    // Reset ball positions
    let i = balls.length;
    while (i--) {
        r.push({ name: balls[i].name, sleep: true, pos: startPos[i], rot: [0, 0, 0], reset: true });
    }
    // Apply changes
    phy.change(r);
    // Restart the simulation
    phy.setTimeout(activeBall, 3000);
};

update = () => {
    let key = phy.getKey()
    if (key[4] === 1) replay()

    a += 1
    let r = [
        { name: 'L_pale1', rot: [0, 0, a + 45] },
        { name: 'L_pale2', rot: [0, 0, -a] },
        // { name: 'L_roll', rot: [0, a, 0] }, // Rotate L_roll
        { name: 'block1', pos: [0, -4.87 + py, open1 ? -1 : 0] },
    ];
    phy.change(r)
    if (game !== 'wantBall') return
    let i = balls.length, b
    while (i--) {
        b = balls[i]
        if (result.indexOf(b.name) === -1) {
            if (b.position.y < (-5.4 + py)) haveBall(b.name);
        }
    }
}

startSimulation = () => {
    phy.setPostUpdate(update)
    phy.setTimeout(wantBall, 12000)
}

wantBall = () => {
    game = 'wantBall';
    open1 = true
}

haveBall = (name) => {
    game = 'haveBall';
    open1 = false;
    result.push(name);

    if (result.length <= export_balls - 1) {
        final.push(Number(name.substring(4)) + 1);
        phy.setTimeout(wantBall, 6000); // Continue the process
    } else {
        final.push(Number(name.substring(4)) + 1);
        phy.log(result);

        // Stop the machine
        open1 = false; // Ensure the block is closed
        game = 'stopped'; // Set the game state to stopped
        phy.setPostUpdate(null); // Stop the update loop

        // Close the block
        phy.change([
            { name: 'block1', pos: [0, -4.87 + py, 0] } // Reset block position to closed
        ]);
        console.log('Machine stopped after exporting the required number of balls.');
    }
    text.set(final.join(' '));
};

makeMachine = () => {
    let friction = 0.5;
    let bounce = 0.3;
    let meshs = [
        'L_roll', 'L_back', 'L_front', 'L_rampe', 'L_pale1', 'L_pale2'
    ]

    let i = meshs.length, name, p, d, m, br, k, shape
    phy.add({
        name: 'block1', type: 'box', density: 0, material: 'glass',
        size: [1, 0.2, 1], pos: [0, -4.87 + py, 0],
        friction: 0, restitution: 0,
        shadow: false,
        kinematic: true,
    })

    while (i--) {
        name = meshs[i]
        br = name === 'L_pale1' || name === 'L_pale2'
        p = name === 'L_pale1'
        d = name === 'L_rampe' ? -1.8 : 0
        k = br ? true : false;

        phy.add({
            name: name,
            type: 'mesh',
            density: 0,
            size: [10],
            meshScale: [10],
            mesh: model[name],
            shape: model[name].geometry,
            material: br ? 'plexi2' : 'glass',
            friction: friction,
            restitution: bounce,
            pos: br ? [0, py, 0] : [8.5, d + py, 0],
            rot: p ? [0, 0, 45] : [0, 0, 0],
            pos: i > 5 ? [8.5, d + py, 0] : [0, py, 0],
            kinematic: k,
            ray: false,
            // debug: true, // Enable debug visualization
        });
    }
}

makeBall = () => {
    let ballGeo = model.ball.geometry.clone();
    ballGeo.scale(100, 100, 100);

    let uvs = [];
    let i, x, y, l, b, tmpMat, j = 0;

    // Generate balls with numbers from 1 to window.import_balls
    for (i = 0; i < window.import_balls; i++) { // Loop for import_balls
        l = Math.floor(i / 10); // Row index
        x = -27 + (j * 6); // Horizontal position
        y = 75 - (l * 5); // Vertical position
        let color = colors[i % colors.length]; // Cycle through colors
        uvs.push(createBallTexture(i + 1, false, color)); // Create texture with ball number and color
        startPos.push([x * 0.1, (y * 0.1) + py, -1.16]); // Store starting position
        j++;
        if (j === 10) j = 0; // Reset horizontal index after 10 balls
    }

    var t = new THREE.CanvasTexture(bigCanvas);
    t.needsUpdate = true;
    t.flipY = false;
    t.repeat.set(1 / 8, 1 / 8);
    t.colorSpace = THREE.SRGBColorSpace;

    tmpMat = phy.material({
        name: 'lotoball',
        roughness: 0.4,
        metalness: 0.6,
        map: t,
    });

    tmpMat.onBeforeCompile = function (shader) {
        let fragment = shader.fragmentShader;
        fragment = fragment.replace('#include <color_fragment>', '');
        fragment = fragment.replace('#include <map_fragment>', `
        #ifdef USE_MAP
            diffuseColor *= texture2D( map, vMapUv+vColor.rg );
        #endif
        `);
        shader.fragmentShader = fragment;
    };

    for (i = 0; i < window.import_balls; i++) { // Add import_balls to the scene
        b = phy.add({
            instance: 'ball',
            material: tmpMat,
            geometry: ballGeo,
            type: 'sphere',
            size: [0.25],
            pos: math.addArray(startPos[i], [math.rand(-0.03, 0.03), math.rand(-0.03, 0.03), math.rand(-0.03, 0.03)]),
            color: uvs[i], // Assign the texture with the color
            density: 0.3,
            friction: 0.4,
            restitution: 0.1,
            sleep: true,
            useCCD: true,
        });

        balls.push(b); // Add ball to the balls array
    }
};

onReset = () => {
    for (let m in tmpTxt) {
        tmpTxt[m].dispose()
    }
};

let tmpN = 0
createBallTexture = (n, y, color = "#c35839") => {
    ctx = tmpCanvas.getContext("2d");
    ctx2 = bigCanvas.getContext("2d");
    // Clear the canvas
    ctx.clearRect(0, 0, 128, 128);
    // Draw the background color
    ctx.beginPath();
    ctx.rect(0, 0, 128, 128);
    ctx.fillStyle = color; // Use the provided color
    ctx.fill();
    // Draw the white circle
    ctx.beginPath();
    ctx.arc(64, 64, 40, 0, 2 * Math.PI); // Centered circle
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    // Draw the number text
    ctx.beginPath();
    ctx.fillStyle = "#000000"; // Black text
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"; // Center the text vertically
    ctx.font = 'bold 48px Arial';
    ctx.fillText(n, 64, 64); // Center the text horizontally and vertically
    // Copy the texture to the big canvas  
    let ny = Math.floor(tmpN / 10);
    let nx = tmpN % 10;
    ctx2.drawImage(tmpCanvas, nx * 128, ny * 128);
    tmpN++;
    // Create a texture and push it to tmpTxt
    const texture = new THREE.CanvasTexture(tmpCanvas);
    tmpTxt.push(texture); // Add the texture to tmpTxt
    return [nx / 10, ny / 10, 0];
};