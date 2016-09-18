export default function() {
  setupProto();

  const options = {
    containerId: "container",
    startPos: { x: 10, y: 10 },
    margin: 10,
    maxSize: { w: 320, h: 240 },
    minSize: { w: 60, h: 90 },
    chord: 5.0,
    awayStep: 1.0,
    enableTries: false,
    importanceModFunc: function(x) {
      return x;
    },
    images: [
      // { url: "6975-1.jpg", imp: 0 },
      // { url: "6979-1.jpg", imp: 1 },
      // { url: "6900-1.jpg", imp: 2 },
      // { url: "6915-1.jpg", imp: 2 },
      // { url: "6829-1.jpg", imp: 3 },
      // { url: "6800-1.jpg", imp: 4 },
      { url: "http://images.brickset.com/sets/images/6975-1.jpg", imp: 0 },
      { url: "http://images.brickset.com/sets/images/6979-1.jpg", imp: 1 },
      { url: "http://images.brickset.com/sets/images/6900-1.jpg", imp: 2 },
      { url: "http://images.brickset.com/sets/images/6915-1.jpg", imp: 3 },
      { url: "http://images.brickset.com/sets/images/6829-1.jpg", imp: 4 },
      { url: "http://images.brickset.com/sets/images/6800-1.jpg", imp: 5 },
      { url: "http://images.brickset.com/sets/images/6982-1.jpg", imp: 6 },
      { url: "http://images.brickset.com/sets/images/6899-1.jpg", imp: 7 },
      { url: "http://images.brickset.com/sets/images/6938-1.jpg", imp: 8 },
      { url: "http://images.brickset.com/sets/images/6856-1.jpg", imp: 9 },
      { url: "http://images.brickset.com/sets/images/6854-1.jpg", imp: 10 },
      { url: "http://images.brickset.com/sets/images/6815-1.jpg", imp: 11 },
      { url: "http://images.brickset.com/sets/images/6958-1.jpg", imp: 12 },
      { url: "http://images.brickset.com/sets/images/6949-1.jpg", imp: 13 },
      { url: "http://images.brickset.com/sets/images/6939-1.jpg", imp: 14 },
      { url: "http://images.brickset.com/sets/images/6929-1.jpg", imp: 15 },
      { url: "http://images.brickset.com/sets/images/6950-1.jpg", imp: 16 },
      { url: "http://images.brickset.com/sets/images/6952-1.jpg", imp: 17 },
      { url: "http://images.brickset.com/sets/images/6989-1.jpg", imp: 18 },
      { url: "http://images.brickset.com/sets/images/6923-1.jpg", imp: 19 },
      { url: "http://images.brickset.com/sets/images/6833-1.jpg", imp: 20 },
      { url: "http://images.brickset.com/sets/images/6811-1.jpg", imp: 21 },
      { url: "http://images.brickset.com/sets/images/6973-1.jpg", imp: 22 },
      { url: "http://images.brickset.com/sets/images/6898-1.jpg", imp: 23 },
      { url: "http://images.brickset.com/sets/images/6879-1.jpg", imp: 24 },
      { url: "http://images.brickset.com/sets/images/6834-1.jpg", imp: 25 },
      { url: "http://images.brickset.com/sets/images/6957-1.jpg", imp: 26 },
    ].sortBy('imp')
  }



  const optionMapping = [
    { optionPath: "startPos.x" },
    { optionPath: "startPos.y" },
    { optionPath: "maxSize.w" },
    { optionPath: "maxSize.h" },
    { optionPath: "minSize.w" },
    { optionPath: "minSize.h" },
    { optionPath: "margin" },
    { optionPath: "chord" },
    { optionPath: "awayStep" },
    { optionPath: "enableTries", type: "checkbox" },
  ];
  function setupForm() {
    const updateButton = window.document.getElementById("update-button");
    updateButton.addEventListener('click', function() {
      arrange(options);
    });
    const form = document.getElementById("options-form");
    optionMapping.forEach(function(inputMap) {
      const row = document.createElement('div');
      const label = document.createElement('label');
      label.innerHTML = inputMap.optionPath;
      row.appendChild(label);
      const input = document.createElement('input');
      row.appendChild(input);
      if (inputMap.type) {
        input.type = inputMap.type;
      }
      if (inputMap.type === "checkbox") {
        input.checked = get(options, inputMap.optionPath);
      } else {
        input.value = get(options, inputMap.optionPath);
      }
      input.addEventListener('change', function() {
        let value;
        if (inputMap.type === "checkbox") {
          value = this.checked;
        } else {
          value = parseFloat(this.value);
        }
        set(options, inputMap.optionPath, value);
        console.log(options);
      });
      form.appendChild(row);
    });
  }
  setupForm();

  const statusDiv = window.document.getElementById('status');

  function setupImages(options) {
    const importances = options.images.map(function(image) {
      return image.imp;
    });
    options.minImp = Math.min(...importances);
    options.maxImp = Math.max(...importances);
    let loadedImages = 0;
    const imagePromises = [];
    options.images.forEach(function(image) {
      imagePromises.push(new Promise(function(resolve, reject) {
        if (image.imageElement) {
          setupImage(image, options);
          resolve();
        } else {
          image.imageElement = new Image();
          image.imageElement.src = image.url;
          image.imageElement.onload = function() {
            statusDiv.innerHTML = ++loadedImages;
            setupImage(image, options);
            resolve();
          };
        }
      }));
    });
    return Promise.all(imagePromises);
  }

  function setupImage(image, options) {
    const pxWidth = image.imageElement.width;
    const pxHeight = image.imageElement.height;
    const importanceFactor = options.importanceModFunc(1 - (image.imp - options.minImp) / options.maxImp);
    if (pxWidth > pxHeight) {
      const maxWidthForThis = options.minSize.w + (options.maxSize.w - options.minSize.w) * importanceFactor;
      const scaledHeightToMaxWidth = maxWidthForThis * pxHeight / pxWidth;
      image.originalHeight = scaledHeightToMaxWidth;
      image.originalWidth = maxWidthForThis;
    } else {
      const maxHeightForThis = options.minSize.h + (options.maxSize.h - options.minSize.h) * importanceFactor;
      const scaledWidthToMaxHeight = maxHeightForThis * pxWidth / pxHeight;
      image.originalWidth = scaledWidthToMaxHeight;
      image.originalHeight = maxHeightForThis;
    }
  }

  // const setupImagesPromise = setupImages(options);

  let arrangeParams;
  let spiralShowParams;

  function initParams(options) {
    arrangeParams = {
      elementId: options.containerId,
      centerX: options.startPos.x,
      centerY: options.startPos.y,
      rotation: 0,
      chord: options.chord,
      awayStep: options.awayStep
    };
    spiralShowParams = {
      elementId: "spiral",
      centerX: arrangeParams.centerX,
      centerY: arrangeParams.centerY,
      rotation: arrangeParams.rotation,
      chord: arrangeParams.chord,
      awayStep: arrangeParams.awayStep
    };
  }

  // const thetaMax = params.coils * 2 * Math.PI;
  //const awayStep = params.radius / thetaMax;

  function equiSpiral(params, func) {
    if (!params.cache) {
      params.cache = [];
    }

    if (!params.contRect) {
      params.contRect = window.document.getElementById(params.elementId).getBoundingClientRect();
    }
    let thetaStartInside = null;
    let theta = params.chord / params.awayStep;
    let iInside = 0;
    let i = 0;
    while (params) {
      let point;
      if (i === 0) {
        point = { x: params.centerX, y: params.centerY, nextTheta: theta };
      } else if (params.cache[i]) {
        //cacheHit++;
        point = params.cache[i];
      } else {
        //calcNum++;
        const away = params.awayStep * theta;
        const around = theta + params.rotation;
        point = {
          x: params.centerX + Math.cos(around) * away,
          y: params.centerY + Math.sin(around) * away,
          nextTheta: theta + params.chord / away
        }
        params.cache[i] = point;
      }
      if (point.x < 0 || point.x > params.contRect.width || point.y < 0 || point.y > params.contRect.height) {
        if (!thetaStartInside) {
          thetaStartInside = theta;
        }
        if (theta - thetaStartInside > 2 * Math.PI) {
          return false;
        }
      } else {
        thetaStartInside = null;
        iInside++;
        if (!func(i, iInside, point)) {
          return true;
        }
      }
      theta = point.nextTheta;
      i += 1;
    }
  }

  function drawSpiral() {
    const spiralContainer = window.document.getElementById(spiralShowParams.elementId);
    const canvasContainerRect = spiralContainer.getBoundingClientRect();
    console.log("canvasContainerRect");
    console.log(canvasContainerRect);
    const canvas = document.getElementById('spiral-graph');
    canvas.width = canvasContainerRect.width;
    canvas.height = canvasContainerRect.height;
    const ctx = canvas.getContext('2d');
    const canvasData = ctx.getImageData(0, 0, canvasContainerRect.width, canvasContainerRect.height);

    // That's how you define the value of a pixel //
    function drawPixel (x, y, r, g, b, a) {
      const index = (x + y * canvas.width) * 4;
      canvasData.data[index + 0] = r;
      canvasData.data[index + 1] = g;
      canvasData.data[index + 2] = b;
      canvasData.data[index + 3] = a;
    }
    equiSpiral(spiralShowParams, function(i, iInside, pos) {
      // ctx.lineTo(pos.x, pos.y);
      drawPixel(Math.round(pos.x), Math.round(pos.y), 255, 255, 255, 255);
      return iInside <= 3000 && i < 20000;
    });
    ctx.putImageData(canvasData, 0, 0);
    // ctx.closePath();
    // ctx.stroke();
  }

  arrange(options);

  function arrange(options) {
    initParams(options);
    setupImages(options).then(function() {
      drawSpiral();
      // return;
      console.time("placement");
      console.log("all images loaded");
      const placedBoxes = [];
      const arrangeContainer = window.document.getElementById(arrangeParams.elementId);
      function appendImage(imageData) {
        const element = imageData.imageElement;
        element.style.width = imageData.width + 'px';
        element.style.height = imageData.height + 'px';
        element.style.left = (imageData.pos.x - imageData.width * 0.5) + 'px';
        element.style.top = (imageData.pos.y - imageData.height * 0.5) + 'px';
        element.style.visibility = "visible";
        if (!element.parentNode) {
          arrangeContainer.appendChild(element);
        }
      }
      let triesLog = [];
      arrangeParams.cache = null;
      options.images.forEach(function(boxData) {
        const clientRect = arrangeContainer.getBoundingClientRect();
        let tryAgain = true;
        let tries = 0;
        boxData.width = boxData.originalWidth;
        boxData.height = boxData.originalHeight;
        do {
          tries++;
          tryAgain = !equiSpiral(arrangeParams, function(i, iInside, pos) {
            const rect2 = {
              width: boxData.width + options.margin,
              height: boxData.height + options.margin
            };
            const offsetX = boxData.width * 0.5 + options.margin;
            const offsetY = boxData.height * 0.5 + options.margin;
            rect2.x = pos.x - offsetX;
            rect2.y = pos.y - offsetY;
            if (pos.x < 0 || pos.y < 0 || pos.x > clientRect.width || pos.y > clientRect.height) {
              return true;
            }
            let collision = false;

            if (rect2.x < 0 || rect2.y < 0 || rect2.x + rect2.width > clientRect.width || rect2.y + rect2.height > clientRect.height) {
              collision = true;
            } else {
              for (let i = 0; i < placedBoxes.length; i++) {
                const pB = placedBoxes[i];
                let rect1 = pB.rect;

                if (rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.height + rect1.y > rect2.y) {
                  collision = true;
                  break;
                }
              }
            }

            if (!collision) {
              boxData.pos = pos;
              boxData.rect = rect2;
              appendImage(boxData);
              placedBoxes.push(boxData);
            }
            return collision;
          });
          if (tryAgain) {
            boxData.width *= 0.5;
            boxData.height *= 0.5;
          }
          if (!options.enableTries && tryAgain) {
            boxData.imageElement.style.visibility = "hidden";
          }

        } while (options.enableTries && tryAgain && tries < 100);

        triesLog.push(tries);
      });

      console.timeEnd("placement");

      console.log(triesLog);
    });
  }
  function setupProto() {

    Array.prototype.sortBy = (function() {
      var sorters = {
        string: function(a, b) {
          if (a < b) {
            return -1;
          } else if (a > b) {
            return 1;
          } else {
            return 0;
          }
        },

        number: function(a, b) {
          return a - b;
        }
      };

      return function(prop) {
        var type = typeof this[0][prop] || 'string';
        return this.sort(function(a, b) {
          return sorters[type](a[prop], b[prop]);
        });
      };
    }());
  }

  function deep(obj, path, value) {
    if (arguments.length === 3) return set.apply(null, arguments);
    return get.apply(null, arguments);
  }

  function get(obj, path) {
    const hasOwnProp = Object.prototype.hasOwnProperty;
    const keys = path.split('.');
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!obj || !hasOwnProp.call(obj, key)) {
        obj = undefined;
        break;
      }
      obj = obj[key];
    }
    return obj;
  }

  function set(obj, path, value) {
    const hasOwnProp = Object.prototype.hasOwnProperty;
    const keys = path.split('.');
    let i;
    for (i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (deep.p && !hasOwnProp.call(obj, key)) obj[key] = {};
      obj = obj[key];
    }
    obj[keys[i]] = value;
    return value;
  }
}
