const canvas = document.querySelector("canvas");
const c = canvas.getContext("2d");

canvas.width = 1024;
canvas.height = 576;
const collisionsMap = [];
for (let i = 0; i < collisions.length; i += 140) {
  collisionsMap.push(collisions.slice(i, 140 + i));
}

const intromap = [];
for (let i = 0; i < introdata.length; i += 140) {
  intromap.push(introdata.slice(i, 140 + i));
}

const charactersMap = []
for (let i = 0; i < charactersMapData.length; i += 140) {
  charactersMap.push(charactersMapData.slice(i, 140 + i))
}
let currentTime = 0;

// ── Weather modes ──────────────────────────────────────────────
// modes: 'day' | 'rain' | 'storm' | 'night'
const weatherModes = ['day', 'rain', 'storm', 'night']
const weatherEmoji = { day: '☀️', rain: '🌧️', storm: '⛈️', night: '🌙' }
let weatherIndex = 0
let weatherMode = 'day'
// timePhase kept for torch – mirrors weatherMode
let timePhase = 'day'

function applyWeather(mode) {
  weatherMode = mode
  timePhase   = mode === 'night' ? 'night' : (mode === 'storm' ? 'dusk' : 'day')

  switch (mode) {
    case 'day':
      canvas.style.filter  = 'none'
      canvas.style.opacity = '1'
      // resize rain pool to 0 (gentle, none)
      raindrops.length = 0
      break
    case 'rain':
      canvas.style.filter  = 'brightness(0.85) saturate(0.8)'
      canvas.style.opacity = '1'
      setRainCount(45, false)
      break
    case 'storm':
      canvas.style.filter  = 'brightness(0.55) saturate(0.5) contrast(1.1)'
      canvas.style.opacity = '1'
      setRainCount(160, true)
      scheduleThunder()
      break
    case 'night':
      canvas.style.filter  = 'grayscale(0.65) brightness(0.45)'
      canvas.style.opacity = '1'
      raindrops.length = 0
      break
  }

  const btn = document.getElementById('weatherBtn')
  if (btn) btn.textContent = weatherEmoji[mode]
}

function setRainCount(n, heavy) {
  raindrops.length = 0
  for (let i = 0; i < n; i++) {
    const d = new Raindrop(getRandom(0, canvas.width), getRandom(0, canvas.height), heavy)
    raindrops.push(d)
  }
}

// Thunder flash
let thunderTimer = null
function scheduleThunder() {
  if (weatherMode !== 'storm') return
  clearTimeout(thunderTimer)
  const delay = getRandom(3000, 8000)
  thunderTimer = setTimeout(() => {
    triggerThunder()
    scheduleThunder()
  }, delay)
}

function triggerThunder() {
  if (weatherMode !== 'storm') return
  const overlay = document.getElementById('overlappingDiv')
  if (!overlay) return
  overlay.style.backgroundColor = '#e8f0ff'
  overlay.style.opacity = '0.7'
  overlay.style.pointerEvents = 'none'
  setTimeout(() => { overlay.style.opacity = '0' }, 80)
  setTimeout(() => {
    overlay.style.opacity = '0.4'
    setTimeout(() => { overlay.style.opacity = '0' }, 60)
  }, 160)
}

// Weather button cycles through modes
document.getElementById('weatherBtn').addEventListener('click', () => {
  clearTimeout(thunderTimer)
  weatherIndex = (weatherIndex + 1) % weatherModes.length
  applyWeather(weatherModes[weatherIndex])
})

// ── old auto-cycle removed, replaced by manual button ──────────
function updateTimeAndVisuals() {}
setInterval(updateTimeAndVisuals, 15000);

// Function to generate random number within a range
function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

class Raindrop {
  constructor(x, y, heavy = false) {
    this.x = x;
    this.y = y;
    this.heavy = heavy
    this.speed  = heavy ? getRandom(14, 20) : getRandom(2, 4);
    this.length = heavy ? getRandom(18, 30) : getRandom(8, 14);
    this.opacity = heavy ? getRandom(0.4, 0.75) : getRandom(0.2, 0.5);
    this.drift  = heavy ? getRandom(0.5, 1.5) : 0; // storm diagonal
  }

  draw() {
    c.strokeStyle = this.heavy
      ? `rgba(140,175,215,${this.opacity})`
      : `rgba(170,200,230,${this.opacity})`;
    c.lineWidth = this.heavy ? 3.5 : 2.5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(this.x, this.y);
    c.lineTo(this.x + this.drift * 3, this.y + this.length);
    c.stroke();
  }

  update() {
    this.y += this.speed;
    this.x += this.drift;
    if (this.y - this.length > canvas.height || this.x > canvas.width) {
      this.y = getRandom(-50, -10);
      this.x = getRandom(0, canvas.width);
    }
    this.draw();
  }
}

// pool starts empty — applyWeather() fills it
const raindrops = [];
// boot with day — must be after raindrops is declared
applyWeather('day')

// Draw directional torch ray in front of player during night/storm
function drawTorchEffect() {
  if (weatherMode === 'day' || weatherMode === 'rain') return

  // player center
  const pw = player.width  || 32
  const ph = player.height || 48
  const px = player.position.x + pw / 2
  const py = player.position.y + ph / 2

  const isNight = weatherMode === 'night'
  const darkness = isNight ? 'rgba(0,0,15,0.92)' : 'rgba(2,4,18,0.80)'

  // ── direction the character faces ──────────────────────────
  // lastkey: w=up, s=down, a=left, d=right  (default down)
  const dirMap = { w: -Math.PI/2, s: Math.PI/2, a: Math.PI, d: 0 }
  const facing = dirMap[lastkey] ?? Math.PI/2

  const rayLen   = isNight ? 220 : 280   // how far the cone reaches
  const halfAngle = Math.PI / 5          // 36° half-angle → 72° cone total

  // ── full-screen dark overlay ───────────────────────────────
  c.save()

  // 1. fill entire screen dark
  c.fillStyle = darkness
  c.fillRect(0, 0, canvas.width, canvas.height)

  // 2. cut out the torch cone using destination-out compositing
  c.globalCompositeOperation = 'destination-out'

  const tipX = px
  const tipY = py
  const coneEndX = px + Math.cos(facing) * rayLen
  const coneEndY = py + Math.sin(facing) * rayLen

  // cone tip gradient — bright at source, fades at tip
  const grad = c.createRadialGradient(tipX, tipY, 2, tipX, tipY, rayLen)
  grad.addColorStop(0,   'rgba(0,0,0,1)')    // fully cut out near player
  grad.addColorStop(0.55,'rgba(0,0,0,0.85)')
  grad.addColorStop(1,   'rgba(0,0,0,0)')    // fades out at cone tip

  c.fillStyle = grad
  c.beginPath()
  c.moveTo(tipX, tipY)
  c.arc(tipX, tipY, rayLen, facing - halfAngle, facing + halfAngle)
  c.closePath()
  c.fill()

  c.globalCompositeOperation = 'source-over'
  c.restore()

  // ── warm yellowish torch glow layered on top ───────────────
  c.save()
  const glowGrad = c.createRadialGradient(tipX, tipY, 0, tipX, tipY, rayLen * 0.9)
  glowGrad.addColorStop(0,    'rgba(255,210,80,0.28)')   // hot yellow at torch
  glowGrad.addColorStop(0.25, 'rgba(255,160,40,0.14)')   // orange mid
  glowGrad.addColorStop(0.6,  'rgba(255,120,20,0.05)')
  glowGrad.addColorStop(1,    'rgba(0,0,0,0)')

  c.fillStyle = glowGrad
  c.beginPath()
  c.moveTo(tipX, tipY)
  c.arc(tipX, tipY, rayLen * 0.9, facing - halfAngle, facing + halfAngle)
  c.closePath()
  c.fill()

  // small warm halo right on the player body (held torch)
  const halo = c.createRadialGradient(tipX, tipY, 0, tipX, tipY, 36)
  halo.addColorStop(0,   'rgba(255,230,120,0.35)')
  halo.addColorStop(0.5, 'rgba(255,180,60,0.12)')
  halo.addColorStop(1,   'rgba(0,0,0,0)')
  c.fillStyle = halo
  c.fillRect(0, 0, canvas.width, canvas.height)

  c.restore()
}



class Sprite {
  constructor({
    position,
    //velocity,
    image,
    frames = { max: 1, hold:10 },
    sprites,
    animate = false,
   // rotation = 0,
    scale = 1
  }) {
    this.position = position
    this.image = new Image()
    this.frames = { ...frames, val: 0, elapsed: 0 }
    this.image.onload = () => {
      this.width = (this.image.width / this.frames.max) * scale
      this.height = this.image.height * scale
    }
    this.image.src = image.src

    this.animate = animate
    this.sprites = sprites
    //this.opacity = 1

   // this.rotation = rotation
    this.scale = scale
  }

  draw() {
 

    const crop = {
      position: {
        x: this.frames.val * (this.width / this.scale),
        y: 0
      },
      width: this.image.width / this.frames.max,
      height: this.image.height
    }

    const image = {
      position: {
        x: this.position.x,
        y: this.position.y
      },
      width: this.image.width / this.frames.max,
      height: this.image.height
    }

    c.drawImage(
      this.image,
      crop.position.x,
      crop.position.y,
      crop.width,
      crop.height,
      image.position.x,
      image.position.y,
      image.width * this.scale,
      image.height * this.scale
    )

   // c.restore()

    if (!this.animate) return

    if (this.frames.max > 1) {
      this.frames.elapsed++
    }

    if (this.frames.elapsed % this.frames.hold === 0) {
      if (this.frames.val < this.frames.max - 1) this.frames.val++
      else this.frames.val = 0
    }
  }
}

class Character extends Sprite {
  constructor({
    position,
    velocity,
    image,
    frames = { max: 1, hold: 10 },
    sprites,
    animate = false,
    rotation = 0,
    scale = 1,
    dialogue = ['']
  }) {
    super({
      position,
      velocity,
      image,
      frames,
      sprites,
      animate,
      rotation,
      scale
    })

    this.dialogue = dialogue
    this.dialogueIndex = 0
  }
}

class Boundary {
  static width = 32;
  static height = 32;
  constructor({ position }) {
    this.position = position;
    this.width = 32;
    this.height = 32;
  }

  draw() {
    c.fillStyle = "rgba(255,0,0,0)";
    c.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
}

const boundaries = [];
const offset = {
  x: -350,
  y: -300,
};

collisionsMap.forEach((row, i) => {
  row.forEach((symbol, j) => {
    if (symbol === 5367)
      boundaries.push(
        new Boundary({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height + offset.y,
          },
        })
      );
  });
});


const intro = [];

intromap.forEach((row, i) => {
  row.forEach((symbol, j) => {
    if (symbol === 2444)
      intro.push(
        new Boundary({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height + offset.y,
          },
        })
      );
  });
});

const characters = []
const idle = new Image()
idle.src = './chr/idle.png'

const bob = new Image()
bob.src = './chr/bob.png'

const amelia = new Image()
amelia.src = './chr/amelia.png'

const adam = new Image()
adam.src = './chr/adam.png'

const alex = new Image()
alex.src = './chr/alex.png'


charactersMap.forEach((row, i) => {
  row.forEach((symbol, j) => {
    // 1890 === idle
    if (symbol === 1890) {
      characters.push(
        new Character({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height-32 + offset.y
          },
          image: idle,
          frames: {
            max: 4,
            hold: 200
          },
          scale: 1,
          animate: true,
          dialogue: ["NISHANT: Hello..Good morning, haven't seen you before are you new to this town....","YOU: Yes! I am a traveller.... ","NISHANT: Have you seen Kaustubh?","NISHANT: I want him to work on my Machine Learning project....", 'NISHANT: His knowledge of TensorFlow and Scikit-learn helps a lot during projects....']
        })
      )
    }
    // 5336 === bob
    else if (symbol === 5336) {
      characters.push(
        new Character({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height-32 + offset.y
          },
          image: bob,
          frames: {
            max: 4,
            hold: 30
          },
          scale: 1,
          animate: true,
          dialogue: ["YOU: Is there anything exciting that I can do in this town... ","PARAS: There is lot's of cool blogs written by Kaustubh, you must check out!","YOU: Thanks!",'PARAS: Why Sun never set here..$#@%@#%@%..',"PARAS: I am feeling sleepy zzzzzzzzzzz"]
        })
      )
    }
//5339==amelia
    else if (symbol === 5339) {
      characters.push(
        new Character({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height -32+ offset.y
          },
          image: amelia,
          frames: {
            max: 4,
            hold: 30
          },
          scale: 1,
          animate: true,
          dialogue: ['NEHA: Hello, Are you new to this town??',"YOU: Yes, I am a traveller in search of exciting peoples...",'NEHA: You must visit the portal & explore the town......','NEHA: I am currently trying to follow Kaustubh on Linkedin & Twitter...' ]
        })
      )
    }
//4527==alex
    else if (symbol === 4527) {
      characters.push(
        new Character({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height-32 + offset.y
          },
          image: alex,
          frames: {
            max: 4,
            hold: 200
          },
          scale: 1,
          animate: true,
          dialogue: ['HARSHIK: This is the coolest place I have ever visited....',"HARSHIK: Have you listen this new music %#@@#$%% by Arjit Singh...... He is amazing!"]
        })
      )
    }
//4519==adam
    else if (symbol === 4519) {
      characters.push(
        new Character({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height-32 + offset.y
          },
          image: adam,
          frames: {
            max: 4,
            hold: 200
          },
          scale: 1,
          animate: true,
          dialogue: ['ADARSH: Are you a friend of Kaustubh?',"YOU: No! But how can i help you?",'ADARSH: I am unable to find him, he is always busy....can you help me??',"YOU: Yeah!, I will help you to find him....","ADARSH: We have decided together to work on a Quantum Computing project $ $ $"]
        })
      )
    }

    if (symbol !== 0) {
      boundaries.push(
        new Boundary({
          position: {
            x: j * Boundary.width + offset.x,
            y: i * Boundary.height + offset.y
          }
        })
      )
    }
  })
})



const image = new Image();
image.src = "back.png";

const foregroundImage = new Image();
foregroundImage.src = "foreground.png";

const pl = new Image();
pl.src = "pleft1.png";
const pu = new Image();
pu.src = "pup1.png";
const pr = new Image();
pr.src = "pright1.png";
const pd = new Image();
pd.src = "pdown1.png";



const audio={
  Map:new Howl({
    src: 'map2.mp3',
    html5:true

  })
}




const player = new Sprite({
  position: {
    x: canvas.width / 2 - 128 / 4 / 2,
    y: canvas.height / 2 - 64 / 2,
  },
  image: pd,
  frames: {
    max: 4,
    hold: 15,
  },
  sprites: {
   up: pu,
  left: pl,
   right: pr,
   down: pd
  }
});



const background = new Sprite({
  position: {
    x: offset.x,
    y: offset.y,
  },
  image: image,
});

const foreground = new Sprite({
  position: {
    x: offset.x,
    y: offset.y,
  },
  image: foregroundImage,
});

const keys = {
  w: {
    pressed: false,
  },
  a: {
    pressed: false,
  },
  s: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  q: {
    pressed: false,
  },
};
const movables = [
  background,
  
  ...boundaries,
  ...intro,
  foreground,
  // ...battleZones,
   ...characters
];

const renderables = [
  background,
  ...boundaries,
  ...intro,
  ...characters,
  player,
  foreground
]

function rectangularCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.position.x + rectangle1.width / 1.15 >= rectangle2.position.x &&
    rectangle1.position.x <= rectangle2.position.x + rectangle2.width / 1.15 &&
    rectangle1.position.y <= rectangle2.position.y + rectangle2.height / 3.75 &&
    rectangle1.position.y + rectangle1.height / 1.25 >= rectangle2.position.y
  );
}



function checkForCharacterCollision({
  characters,
  player,
  characterOffset = { x: 0, y: 0 }
}) {
  player.interactionAsset = null
  // monitor for character collision
  for (let i = 0; i < characters.length; i++) {
    const character = characters[i]

    if (
      rectangularCollision({
        rectangle1: player,
        rectangle2: {
          ...character,
          position: {
            x: character.position.x + characterOffset.x,
            y: character.position.y +25+ characterOffset.y
          }
        }
      })
    ) {
      player.interactionAsset = character
      break
    }
  }
}

const battle = {
  initiated: false
}
function animate() {
  const animationId=window.requestAnimationFrame(animate);
  c.clearRect(0, 0, canvas.width, canvas.height);
  renderables.forEach((renderable) => {
    renderable.draw()
  })
  foreground.draw();

  // rain — subtle, slow
  raindrops.forEach(r => r.update());

  // night torch/spotlight effect — drawn over everything
  drawTorchEffect();
  let moving = true;
  player.animate=false

  if (battle.initiated) return 
  
  if (keys.w.pressed||keys.a.pressed||keys.s.pressed||keys.d.pressed||keys.q.pressed ){
    for (let i = 0; i < intro.length; i++) {
      const intr = intro[i];
      
      if (
        rectangularCollision({
          rectangle1: player,
          rectangle2: intr
        })&& keys.q.pressed 
      ) {
        //moving = false;
       // console.log("bzcollsion")
        window.cancelAnimationFrame(animationId)
        audio.Map.stop()
        
       
        battle.initiated =true
        gsap.to("#overlappingDiv",{
          opacity:1,
          repeat: 1,
          yoyo:true,
          duration:0.4,
          onComplete(){
            gsap.to("#overlappingDiv",{
              opacity:1,
              duration:0.4,
              onComplete(){
                initBattle()
                //animateBattle()
                gsap.to("#overlappingDiv",{
                  opacity:0,
                  duration:0.4})
              }
          })
          
           
        }
        })
        break;
      }
    }
  }
  

  if (keys.w.pressed && lastkey === "w") {
    player.animate=true
    player.moving=true
   
    
    player.image=player.sprites.up

    checkForCharacterCollision({
      characters,
      player,
      characterOffset: { x: 0, y: 3 }
    })


    for (let i = 0; i < boundaries.length; i++) {
      const boundary = boundaries[i];
      if (
        rectangularCollision({
          rectangle1: player,
          rectangle2: {
            ...boundary,
            position: {
              x: boundary.position.x,
              y: boundary.position.y + 3,
            },
          },
        })
      ) {
        moving = false;
        break;
      }
    }
    
    if (moving)
      movables.forEach((movable) => {
        movable.position.y += 3;
      });
  } else if (keys.a.pressed && lastkey === "a") {
    player.animate=true
    player.moving=true
    player.image=player.sprites.left

    checkForCharacterCollision({
      characters,
      player,
      characterOffset: { x: 3, y: 0 }
    })

    for (let i = 0; i < boundaries.length; i++) {
      const boundary = boundaries[i];
      if (
        rectangularCollision({
          rectangle1: player,
          rectangle2: {
            ...boundary,
            position: {
              x: boundary.position.x + 3,
              y: boundary.position.y,
            },
          },
        })
      ) {
        moving = false;
        break;
      }
    }

    if (moving)
      movables.forEach((movable) => {
        movable.position.x += 3;
      });
  } else if (keys.s.pressed && lastkey === "s") {
    player.animate=true
    player.moving=true
    player.image=player.sprites.down

    checkForCharacterCollision({
      characters,
      player,
      characterOffset: { x: 0, y: -3 }
    })

    for (let i = 0; i < boundaries.length; i++) {
      const boundary = boundaries[i];
      if (
        rectangularCollision({
          rectangle1: player,
          rectangle2: {
            ...boundary,
            position: {
              x: boundary.position.x,
              y: boundary.position.y - 3,
            },
          },
        })
      ) {
        moving = false;
        break;
      }
    }

    if (moving)
      movables.forEach((movable) => {
        movable.position.y -= 3;
      });
  }
   else if (keys.d.pressed && lastkey === "d") {
    player.animate=true
    player.moving=true
    player.image=player.sprites.right
    
    checkForCharacterCollision({
      characters,
      player,
      characterOffset: { x: -3, y: 0 }
    })

    for (let i = 0; i < boundaries.length; i++) {
      const boundary = boundaries[i];
      if (
        rectangularCollision({
          rectangle1: player,
          rectangle2: {
            ...boundary,
            position: {
              x: boundary.position.x - 3,
              y: boundary.position.y,
            },
          },
        })
      ) {
        moving = false;
        break;
      }
    }

    if (moving)
      movables.forEach((movable) => {
        movable.position.x -= 3;
      });
  }
}

animate();



//let battleAnimationId
function initBattle(){
  document.querySelector('#userInterface').style.display="block"
 //document.querySelector('#dialogueBox').style.display="none"
 document.querySelector('#attacksbox').style.display="block"



}

//animateBattle()
document.querySelectorAll('#attacksBox button').forEach((button)=>{
  button.addEventListener("click",()=>{
    animate()
    document.querySelector("#userInterface").style.display="none"
    gsap.to("#overlappingDiv",{
      opacity:0
    })
    battle.initiated = false
    if (soundOn) audio.Map.play()
  })
})
let lastkey = "";
window.addEventListener("keydown", (e) => {

  if (player.isInteracting) {
    switch (e.key) {
      case ' ':
        player.interactionAsset.dialogueIndex++

        const { dialogueIndex, dialogue } = player.interactionAsset
        if (dialogueIndex <= dialogue.length - 1) {
          document.querySelector('#characterDialogueBox').innerHTML =
            player.interactionAsset.dialogue[dialogueIndex]
          return
        }

        // finish conversation
        player.isInteracting = false
        player.interactionAsset.dialogueIndex = 0
        document.querySelector('#characterDialogueBox').style.display = 'none'

        break
    }
    return
  }

  switch (e.key) {

    case ' ':
      if (!player.interactionAsset) return

      // beginning the conversation
      const firstMessage = player.interactionAsset.dialogue[0]
      document.querySelector('#characterDialogueBox').innerHTML = firstMessage
      document.querySelector('#characterDialogueBox').style.display = 'flex'
      player.isInteracting = true
      break

    case "w":
      keys.w.pressed = true;
      lastkey = "w";
      break;
    case "a":
      keys.a.pressed = true;
      lastkey = "a";
      break;
    case "s":
      keys.s.pressed = true;
      lastkey = "s";
      break;
    case "d":
      keys.d.pressed = true;
      lastkey = "d";
      break;
    case "q":
      keys.q.pressed = true;
      lastkey = "q";
      break;
  }
});
window.addEventListener("keyup", (e) => {
  switch (e.key) {
    case "w":
      keys.w.pressed = false;
      break;
    case "a":
      keys.a.pressed = false;
      break;
    case "s":
      keys.s.pressed = false;
      break;
    case "d":
      keys.d.pressed = false;
      break;
    case "q":
      keys.q.pressed = false;
      break;
  }
});
let soundOn = false
const soundToggle = document.getElementById('soundToggle')
const soundKnob = document.getElementById('soundKnob')
const soundLabel = document.getElementById('soundLabel')
soundToggle.addEventListener('change', () => {
  soundOn = soundToggle.checked
  if (soundOn) {
    audio.Map.play()
    soundKnob.style.left = '28px'
    soundKnob.style.background = '#9aff58'
    document.getElementById('soundSlider').style.background = '#0a2a10'
    soundLabel.style.color = '#9aff58'
    soundLabel.textContent = 'ON'
  } else {
    audio.Map.pause()
    soundKnob.style.left = '2px'
    soundKnob.style.background = '#9aff58'
    document.getElementById('soundSlider').style.background = '#333'
    soundLabel.style.color = '#555'
    soundLabel.textContent = 'OFF'
  }
})

// WASD on-screen buttons — simulate keydown/keyup events
document.querySelectorAll('.wasd-btn').forEach((btn) => {
  const key = btn.dataset.key

  const pressKey = () => {
    btn.style.background = '#ffdd57'
    btn.style.color = '#000'
    window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  }

  const releaseKey = () => {
    btn.style.background = '#2a2a2a'
    btn.style.color = '#ffdd57'
    window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }))
  }

  btn.addEventListener('mousedown', pressKey)
  btn.addEventListener('mouseup', releaseKey)
  btn.addEventListener('mouseleave', releaseKey)
  btn.addEventListener('touchstart', (e) => { e.preventDefault(); pressKey() }, { passive: false })
  btn.addEventListener('touchend', (e) => { e.preventDefault(); releaseKey() }, { passive: false })
})
