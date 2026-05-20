export class DialogueRunner {
  // config depends on the scene because some  scense  look differente
  constructor(scene, config) {
    // store the scene (we use this in different scenes too)
    this.scene = scene;

    this.data = config.data;

    this.box = config.box;

    // positnoinig and styles
    this.fontSize = config.fontSize || 26;
    this.typeSpeed = config.typeSpeed || 28;

    // call backs
    this.onAction = config.onAction || null; //run when he dialogue.json is an ACTION
    this.onDone = config.onDone || null; // run when all dialogue finish

    // wha tline of the dialogue we are on (keeps track)
    this.index = 0;

    this.fullText = "";

    this.visibleText = "";

    this.charIndex = 0; // for the typing animation, show which current character on the dialogue we are tyoping so like "hello", if we typed h, then the charindex is liek 1 or smth

    this.isTyping = false;

    // dont allowed inptu from player
    this.isLocked = false;

    this.dialogueVisible = true;
    this.typeTimer = null;
    this.lines = [];

    //!! heopfully doenst crash if this.daata is undefined
    // console.log("1")
    this.lines = this.data.lines;
    // console.log("2")

    const bL = this.box.x - this.box.displayWidth * this.box.originX;

    const bTp = this.box.y - this.box.displayHeight * this.box.originY;

    const bWi = this.box.displayWidth;

    const bHe = this.box.displayHeight;

    // other  styels like padding
    // USING a lot of || because all the scenes migth have differet dialogue styles or we want to change a psecific style of the dialogue BUT this is the default so we dont need to pass it in every single time
    this.boxPadX = config.boxPadX || 78;
    this.boxPadY = config.boxPadY || 34;
    this.textX = config.textX || bL + this.boxPadX;

    this.textY = config.textY || bTp + this.boxPadY;
    this.textW = config.textW || bWi - this.boxPadX * 2 - 80;
    this.nextX = config.nextX || bL + bWi - 58;

    this.nextY = config.nextY || bTp + bHe / 2;

    // main text that yu see
    this.textObj = this.scene.add.text(this.textX, this.textY, "", {
      fontFamily: "Dogica",
      fontSize: `${this.fontSize}px`,
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
      wordWrap: { width: this.textW },
      lineSpacing: 10,
    });
    this.textObj.setOrigin(0, 0);

    this.textObj.setDepth(3002);

    this.arrNextThing = this.scene.add.text(this.nextX, this.nextY, ">", {
      fontFamily: "DogicaBold",
      fontSize: "32px",

      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4,
    });

    this.arrNextThing.setOrigin(0.5);

    this.arrNextThing.setDepth(3003);

    this.arrNextThing.setVisible(false);

    this.hitThing = this.scene.add.zone(bL + bWi / 2, bTp + bHe / 2, bWi, bHe);

    this.hitThing.setOrigin(0.5);
    this.hitThing.setDepth(3004);
    this.hitThing.setInteractive({ useHandCursor: false });

    this.hitThing.on("pointerdown", () => {
      // console.log("testtstest")
      this.press();
    });

    // cursor icon types
    this.hitThing.on("pointerover", () => {
      if (this.isLocked) return;
      if (!this.dialogueVisible) return;

      this.scene.input.setDefaultCursor("pointer");
    });

    this.hitThing.on("pointerout", () => {
      this.scene.input.setDefaultCursor("default");
    });
  }

  start() {
    //reeste sback to 0 when  new dialogue
    this.index = 0;

    this.showCurrent();
  }

  destroy() {
    // window.alert("EYSYESYSYESY")
    // console.log("eworw")
    if (this.typeTimer) {
      this.typeTimer.remove(false);
      this.typeTimer = null;
    }

    this.scene.input.setDefaultCursor("default");

    if (this.textObj) {
      this.textObj.destroy();
    }
    if (this.arrNextThing) {
      this.arrNextThing.destroy();
    }

    if (this.hitThing) {
      this.hitThing.destroy();
    }
  }

  press() {
    // cant click when lcoked and not visible dialogeu (eg. during actions)
    if (this.isLocked) return;

    if (!this.dialogueVisible) return;

    if (this.isTyping) {
      this.isTyping = false;

      if (this.typeTimer) {
        this.typeTimer.remove(false);

        this.typeTimer = null;
      }

      this.visibleText = this.fullText;

      this.textObj.setText(this.fullText);

      if (this.dialogueVisible) {
        this.arrNextThing.setVisible(true);
      }

      return;
    }

    this.next();
  }

  async showCurrent() {
    if (this.index >= this.lines.length) {
      this.isLocked = true;
      this.isTyping = false;
      this.arrNextThing.setVisible(false);

      if (this.typeTimer) {
        this.typeTimer.remove(false);
        this.typeTimer = null;
      }

      if (this.onDone) {
        this.onDone(this);
      }

      return;
    }

    const line = this.lines[this.index];

    if (!line) {
      this.index += 1;

      this.showCurrent();
      return;
    }

    if (line.type === "ui") {
      //next line
      await this.uiLineOMg(line);

      this.index += 1;
      this.showCurrent();

      return;
    }

    //actions / custom scenes
    if (line.type === "action") {
      await this.actionGO(line);
      this.index += 1;
      this.showCurrent();
      return;
    }

    // dialogue liek speaking speech when charctesrs talk
    if (line.type === "say") {
      this.showSay(line);
      return;
    }

    // console.log("DONEST WORK NO LINE.TYPE WORING")

    this.index += 1;

    this.showCurrent();
  }

  showSay(line) {
    this.isLocked = false;

    this.isTyping = true;

    this.arrNextThing.setVisible(false);

    if (this.dialogueVisible) {
      this.box.setVisible(true);

      this.textObj.setVisible(true);
      this.hitThing.setInteractive({ useHandCursor: false });
    }

    const speaker = line.speaker;

    if (speaker) {
      if (line.text) {
        this.fullText = `${speaker}: ${line.text}`;
      } else {
        this.fullText = `${speaker}: `;
      }
    } else {
      if (line.text) {
        this.fullText = line.text;
      } else {
        this.fullText = "";
      }
    }

    ///reste
    this.visibleText = "";
    this.charIndex = 0;

    this.textObj.setText("");

    // actual actiosn running
    const actions = line.actions || [];

    actions.forEach((action) => {
      let actionLine = action;

      if (typeof action === "string") {
        actionLine = { id: action };
      }

      if (!actionLine || !actionLine.id) return;

      // send to outside scene
      if (this.onAction) {
        this.onAction(
          {
            type: "action",
            ...actionLine,
          },
          this,
        );
      }
    });

    if (this.typeTimer) {
      this.typeTimer.remove(false);

      this.typeTimer = null;
    }

    this.typeTimer = this.scene.time.addEvent({
      delay: this.typeSpeed,
      loop: true,
      callback: () => {
        this.typeNextChar();
      },
    });
  }

  typeNextChar() {
    // console.log("WORKING")
    if (!this.isTyping) return;
    // console.log("WORKING2")

    this.charIndex += 1;

    //
    this.visibleText = this.fullText.slice(0, this.charIndex);
    this.textObj.setText(this.visibleText);

    if (this.charIndex >= this.fullText.length) {
      this.isTyping = false;

      // stop timer
      if (this.typeTimer) {
        this.typeTimer.remove(false);

        this.typeTimer = null;
      }

      this.visibleText = this.fullText;

      this.textObj.setText(this.fullText);

      if (this.dialogueVisible) {
        this.arrNextThing.setVisible(true);
      }
    }
    //t
  }

  next() {
    // hide next arrow
    this.arrNextThing.setVisible(false);

    this.index += 1;

    this.showCurrent();
  }

  async actionGO(line) {
    this.isLocked = true;

    this.isTyping = false;

    this.arrNextThing.setVisible(false);

    if (this.typeTimer) {
      this.typeTimer.remove(false);
      this.typeTimer = null;
    }

    if (this.onAction) {
      await this.onAction(line, this);
    }

    this.isLocked = false;
  }

  async uiLineOMg(line) {
    this.isLocked = true;

    this.isTyping = false;

    if (this.typeTimer) {
      this.typeTimer.remove(false);

      this.typeTimer = null;
    }

    this.textObj.setText("");

    this.arrNextThing.setVisible(false);

    const visible = !!line.dialogueVisible;

    const lowtaperfade = line.lowtaperfade || 0;

    this.dialogueVisible = visible;

    const stuff = [this.box, this.textObj];

    await new Promise((resolve) => {
      if (visible) {
        this.box.setVisible(true);
        this.textObj.setVisible(true);

        this.hitThing.setInteractive({ useHandCursor: false });

        if (lowtaperfade > 0) {
          this.box.setAlpha(0);
          this.textObj.setAlpha(0);

          this.scene.tweens.add({
            targets: stuff,
            alpha: 1,
            duration: lowtaperfade,
            ease: "Cubic.Out",
            onComplete: resolve,
          });
        } else {
          this.box.setAlpha(1);
          this.textObj.setAlpha(1);
          resolve();
        }

        return;
      }

      this.hitThing.disableInteractive();

      if (lowtaperfade > 0) {
        this.scene.tweens.add({
          stuff,
          alpha: 0,
          duration: lowtaperfade,
          ease: "Cubic.In",
          onComplete: () => {
            this.box.setVisible(false);
            this.textObj.setVisible(false);
            resolve();
          },
        });
      } else {
        this.box.setAlpha(0);

        this.textObj.setAlpha(0);
        this.box.setVisible(false);
        this.textObj.setVisible(false);
        resolve();
      }
    });

    this.isLocked = false;
  }
}
