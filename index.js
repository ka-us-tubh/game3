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
    src: 'map1.mp3',
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
    hold: 10,
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
  renderables.forEach((renderable) => {
    renderable.draw()
  })
  
  foreground.draw();
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
document.querySelectorAll('button').forEach((button)=>{
  button.addEventListener("click",()=>{
    //cancelAnimationFrame(battleAnimationId)
    animate( )
    document.querySelector("#userInterface").style.display="none"
    gsap.to("#overlappingDiv",{
      opacity:0
    })
    battle.initiated = false
    audio.Map.play()
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
let clicked=false
window.addEventListener("click",()=>{
  if (!clicked){
    audio.Map.play()
    clicked=true

  }


})