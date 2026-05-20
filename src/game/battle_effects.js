import Phaser from "phaser";


export class BattleEffects {
  static play(scene, effectId, targetDisplay, data = {}) {
    if (!targetDisplay || !targetDisplay.root) {
      return;
    }

    if (effectId === "heal") {
      scene.cameras.main.shake(35, 0.001);

      const amountHealingOk = Number(data.heal || data.amount || 0);

      if (amountHealingOk > 0) {
        for (let i = 0; i < 8; i += 1) {
          const startX = targetDisplay.root.x + Phaser.Math.Between(-120, 120);

          const startY = targetDisplay.root.y + Phaser.Math.Between(-310, -120);

          let textstuff = "+";

          if (i === 0) {
            textstuff = `+${amountHealingOk}`;
          }

          let fontSize = "18px";

          if (i === 0) {
            fontSize = "24px"; /// big firsts one
          }

          const healText = scene.add.text(startX, startY, textstuff, {
            fontFamily: "DogicaBold",
            fontSize: fontSize,
            color: "#62ff8f",

            stroke: "#0b2b16",
            strokeThickness: 5,
          });

          healText.setOrigin(0.5);

          healText.setDepth(706);

          healText.setAlpha(0);
          if (i === 0) {
            healText.setScale(1.4);
          } else {
            healText.setScale(1);
          }

          scene.tweens.add({
            targets: healText,
            alpha: 1,
            duration: 90,
            ease: "Quad.Out",
            onComplete: () => {
              scene.tweens.add({
                targets: healText,
                y: healText.y - Phaser.Math.Between(35, 80),
                x: healText.x + Phaser.Math.Between(-24, 24),
                alpha: 0,
                duration: Phaser.Math.Between(650, 950),
                ease: "Sine.Out",
                onComplete: () => {
                  healText.destroy();
                },
              });
            },
          });
        }
      }

      const staminaYes = Number(data.staminaRecover || data.stamina || 0);

      if (staminaYes > 0) {
        for (let i = 0; i < 8; i += 1) {
          const startX = targetDisplay.root.x + Phaser.Math.Between(-120, 120);

          const startY = targetDisplay.root.y + Phaser.Math.Between(-300, -110);

          let textstuff = "+";

          if (i === 0) {
            textstuff = `+${staminaYes}`;
          }

          let fontSize = "18px";
          let textsizingi = 1;

          if (i === 0) {
            fontSize = "24px";
            textsizingi = 1.4;
          }

          const stamTxt = scene.add.text(startX, startY, textstuff, {
            fontFamily: "DogicaBold",
            fontSize: fontSize,
            color: "#4af0ff",
            stroke: "#082a33",
            strokeThickness: 5,
          });

          stamTxt.setScale(textsizingi);

          stamTxt.setOrigin(0.5);

          stamTxt.setDepth(706);
          stamTxt.setAlpha(0);

          scene.tweens.add({
            targets: stamTxt,
            alpha: 1,
            duration: 90,
            ease: "Quad.Out",
            onComplete: () => {
              scene.tweens.add({
                targets: stamTxt,
                y: stamTxt.y - Phaser.Math.Between(35, 80),
                x: stamTxt.x + Phaser.Math.Between(-24, 24),
                alpha: 0,
                duration: Phaser.Math.Between(650, 950),
                ease: "Sine.Out",
                onComplete: () => {
                  stamTxt.destroy();
                },
              });
            },
          });
        }
      }

      return;
    }

    if (effectId === "stamina") {
      scene.cameras.main.shake(25, 0.0008);

      const staminaYes = Number(data.staminaRecover || data.stamina || 0);

      if (staminaYes <= 0) {
        return;
      }

      for (let i = 0; i < 10; i += 1) {
        const startX = targetDisplay.root.x + Phaser.Math.Between(-120, 120);

        const startY = targetDisplay.root.y + Phaser.Math.Between(-300, -110);

        let textstuff = "+";

        if (i === 0) {
          textstuff = `+${staminaYes}`;
        }

        let ss = 1;

        // let t
        let the = "18px";

        if (i === 0) {
          the = "24px";
          ss = 1.4;
        }

        const stamTxt = scene.add.text(startX, startY, textstuff, {
          fontFamily: "DogicaBold",
          fontSize: the,
          color: "#4af0ff",
          stroke: "#082a33",
          strokeThickness: 5,
        });

        stamTxt.setScale(ss);

        stamTxt.setOrigin(0.5);

        stamTxt.setDepth(706);
        stamTxt.setAlpha(0);

        scene.tweens.add({
          targets: stamTxt,
          alpha: 1,
          duration: 90,
          ease: "Quad.Out",
          onComplete: () => {
            scene.tweens.add({
              targets: stamTxt,
              y: stamTxt.y - Phaser.Math.Between(35, 80),
              x: stamTxt.x + Phaser.Math.Between(-24, 24),
              alpha: 0,
              duration: Phaser.Math.Between(650, 950),
              ease: "Sine.Out",
              onComplete: () => {
                stamTxt.destroy();
              },
            });
          },
        });
      }

      return;
    }

    if (effectId === "shield") {
      // TODO: maybe add check to see if shield texture exists later

      const randomX = Phaser.Math.Between(-8, 8);
      const randomY = Phaser.Math.Between(-8, 8);

      const shield = scene.add.image(
        targetDisplay.root.x + randomX,
        targetDisplay.root.y - 205 + randomY,
        "effect-shield",
      );

      shield.setOrigin(0.5);
      shield.setDepth(700);
      shield.setAlpha(0);
      shield.setScale(2.5);
      shield.setAngle(0);
      shield.setBlendMode(Phaser.BlendModes.SCREEN);

      scene.tweens.add({
        targets: shield,
        alpha: 0.45,
        scaleX: 7,
        scaleY: 7,
        duration: 120,
        ease: "Back.Out",
        onComplete: () => {
          scene.cameras.main.shake(45, 0.0015);

          for (let i = 0; i < 12; i += 1) {
            const startX =
              targetDisplay.root.x + Phaser.Math.Between(-165, 165);
            const startY =
              targetDisplay.root.y + Phaser.Math.Between(-365, -85);

            const plus = scene.add.text(startX, startY, "+", {
              fontFamily: "DogicaBold",
              fontSize: "20px",
              color: "#9fcfff",
              stroke: "#1b3144",
              strokeThickness: 4,
            });

            plus.setOrigin(0.5);
            plus.setDepth(705);
            plus.setAlpha(0);

            plus.setScale(3);

            scene.tweens.add({
              targets: plus,
              alpha: 1,
              duration: 80,
              ease: "Quad.Out",
              onComplete: () => {
                scene.tweens.add({
                  targets: plus,
                  y: plus.y - Phaser.Math.Between(35, 70),
                  x: plus.x + Phaser.Math.Between(-22, 22),
                  alpha: 0,
                  duration: Phaser.Math.Between(550, 850),
                  ease: "Sine.Out",
                  onComplete: () => {
                    plus.destroy();
                  },
                });
              },
            });
          }

          shield.setTintFill(0xffffff);

          scene.time.delayedCall(45, () => {
            shield.clearTint();
          });

          scene.tweens.add({
            targets: shield,
            alpha: 0,
            scaleX: 7,
            scaleY: 7,
            duration: 230,
            delay: 180,
            ease: "Quad.In",
            onComplete: () => {
              shield.destroy();
            },
          });
        },
      });

      return;
    }

    if (effectId === "zombie-maul") {
      const randomX = Phaser.Math.Between(-26, 26);

      const randomY = Phaser.Math.Between(-18, 18);
      const randomAngle = Phaser.Math.Between(-5, 5);

      const effect = scene.add.image(
        targetDisplay.root.x + randomX,
        targetDisplay.root.y - 190 + randomY,
        "effect-zombie-maul",
      );

      effect.setOrigin(0.5);
      effect.setDepth(700);
      effect.setAlpha(0);

      effect.setScale(4);

      effect.setAngle(randomAngle);
      effect.setBlendMode(Phaser.BlendModes.SCREEN);

      scene.tweens.add({
        targets: effect,
        alpha: 1,
        scaleX: 10,
        scaleY: 10,
        duration: 90,
        ease: "Back.Out",
        onComplete: () => {
          scene.cameras.main.shake(80, 0.02);

          effect.setTintFill(0xffffff);

          scene.time.delayedCall(45, () => {
            effect.clearTint();
          });

          scene.tweens.add({
            targets: effect,
            alpha: 0,
            scaleX: 8,
            scaleY: 8,
            duration: 150,
            delay: 70,
            ease: "Quad.In",
            onComplete: () => {
              effect.destroy();
            },
          });
        },
      });

      return;
    }
  }
}
