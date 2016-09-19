export default function() {
  setupProto();

  const defaultOptions = {
    containerId: "container",
    startPos: { x: 10, y: 10 },
    margin: 10,
    maxSize: { w: 320, h: 240 },
    minSize: { w: 60, h: 90 },
    chord: 5.0,
    awayStep: 1.0,
    enableTries: false,
    impFn: "x",
    imagesCSV:
`http://images.brickset.com/sets/images/6975-1.jpg,0
http://images.brickset.com/sets/images/6979-1.jpg,1
http://images.brickset.com/sets/images/6900-1.jpg,2
http://images.brickset.com/sets/images/6915-1.jpg,3
http://images.brickset.com/sets/images/6829-1.jpg,4
http://images.brickset.com/sets/images/6800-1.jpg,5
http://images.brickset.com/sets/images/6982-1.jpg,6
http://images.brickset.com/sets/images/6899-1.jpg,7
http://images.brickset.com/sets/images/6938-1.jpg,8
http://images.brickset.com/sets/images/6856-1.jpg,9
http://images.brickset.com/sets/images/6854-1.jpg,10
http://images.brickset.com/sets/images/6815-1.jpg,11
http://images.brickset.com/sets/images/6958-1.jpg,12
http://images.brickset.com/sets/images/6949-1.jpg,13
http://images.brickset.com/sets/images/6939-1.jpg,14
http://images.brickset.com/sets/images/6929-1.jpg,15
http://images.brickset.com/sets/images/6950-1.jpg,16
http://images.brickset.com/sets/images/6952-1.jpg,17
http://images.brickset.com/sets/images/6989-1.jpg,18
http://images.brickset.com/sets/images/6923-1.jpg,19
http://images.brickset.com/sets/images/6833-1.jpg,20
http://images.brickset.com/sets/images/6811-1.jpg,21
http://images.brickset.com/sets/images/6973-1.jpg,22
http://images.brickset.com/sets/images/6898-1.jpg,23
http://images.brickset.com/sets/images/6879-1.jpg,24
http://images.brickset.com/sets/images/6834-1.jpg,25
http://images.brickset.com/sets/images/6957-1.jpg,26`
  };

  let options;
  if (localStorage.arrangerOptions) {
    try {
      options = JSON.parse(localStorage.arrangerOptions);
    } catch (e) {
    }
  } else {
    options = JSON.parse(JSON.stringify(defaultOptions));
  }


  const optionMapping = [
    { path: "startPos.x" },
    { path: "startPos.y" },
    { path: "maxSize.w" },
    { path: "maxSize.h" },
    { path: "minSize.w" },
    { path: "minSize.h" },
    { path: "margin" },
    { path: "chord" },
    { path: "awayStep" },
    { path: "impFn", type: "text" },
    { path: "enableTries", type: "checkbox" },
    { path: "imagesCSV", type: "textarea" }
  ];
  function setupForm() {
    const updateButton = window.document.getElementById("update-button");
    updateButton.addEventListener('click', function() {
      localStorage.arrangerOptions = JSON.stringify(options);
      arrange(options);
    });
    const form = document.getElementById("options-form");

    optionMapping.forEach(function(inputMap) {
      const row = document.createElement('div');
      const label = document.createElement('label');
      label.innerHTML = inputMap.path;
      row.appendChild(label);
      const input = document.createElement(inputMap.type === 'textarea' ? 'textarea' : 'input');
      row.appendChild(input);
      if (inputMap.type !== "textarea") {
        input.type = inputMap.type || 'number';
      }
      const value = get(options, inputMap.path);
      if (inputMap.type === "checkbox") {
        input.checked = value;
      } else {
        input.value = value;
      }
      input.addEventListener('change', function() {
        let value;
        if (inputMap.type === "textarea" || inputMap.type === "text") {
          value = this.value;
        } else if (inputMap.type === "checkbox") {
          value = this.checked;
        } else {
          value = parseFloat(this.value);
        }
        set(options, inputMap.path, value);
        console.log(options);
      });
      form.appendChild(row);
    });
  }
  setupForm();

  // const statusDiv = window.document.getElementById('status');
  let imageStore = [];
  let imageCache = [];
  let minImp;
  let maxImp;
  function setupImages(options) {
    const parsedImages = options.imagesCSV.split(/\r?\n/).filter(function(line) {
      const firstChar = line[0];
      return firstChar !== ';' && firstChar !== '#' && (firstChar !== '/' || line[1] !== '/');
    }).map(function(line) {
      const parts = line.split(',');
      return {
        url: parts[0],
        imp: parseFloat(parts[1])
      };
    });
    const newImageStore = [];
    parsedImages.forEach(function(parsedImage) {
      const cachedImage = imageCache.findBy('url', parsedImage.url);
      if (cachedImage) {
        console.log('LOAD FROM CACHE ' + parsedImage.url);
        cachedImage.imp = parsedImage.imp;
        newImageStore.push(cachedImage);
      } else {
        console.log('ADDING ' + parsedImage.url);
        newImageStore.push(parsedImage);
        if (!imageCache.findBy('url', parsedImage.url)) {
          console.log('CACHING ' + parsedImage.url);
          imageCache.push(parsedImage);
        }
      }
    });
    if (imageStore.length) {
      imageStore.forEach(function(oldImage) {
        if (!newImageStore.findBy('url', oldImage.url)) {
          console.log('REMOVING ' + oldImage.url);
          oldImage.imageElement.remove();
        };
      });
    }
    console.log('CACHE SIZE: ' + imageCache.length);
    imageStore = newImageStore.sortBy('imp');

    const importances = imageStore.map(function(image) {
      return image.imp;
    });
    minImp = Math.min(...importances);
    maxImp = Math.max(...importances);
    let loadedImages = 0;
    const imagePromises = [];
    imageStore.forEach(function(image) {
      imagePromises.push(new Promise(function(resolve, reject) {
        if (image.imageElement) {
          setupImage(image, options);
          resolve();
        } else {
          image.imageElement = new Image();
          image.imageElement.src = image.url;
          image.imageElement.onload = function() {
            // statusDiv.innerHTML = ++loadedImages;
            setupImage(image, options);
            resolve();
          };
        }
      }));
    });
    return Promise.all(imagePromises);
  }

  function importanceModFunc(x) {
    return eval(options.impFn);
  }
  function setupImage(image, options) {
    const pxWidth = image.imageElement.width;
    const pxHeight = image.imageElement.height;
    const importanceFactor = importanceModFunc(1 - (image.imp - minImp) / maxImp);
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
      centerX: 150,
      centerY: 150,
      rotation: arrangeParams.rotation,
      chord: arrangeParams.chord,
      awayStep: arrangeParams.awayStep
    };
  }

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
    // const canvasContainerRect = spiralContainer.getBoundingClientRect();
    // console.log("canvasContainerRect");
    // console.log(canvasContainerRect);
    const canvas = document.getElementById('spiral-graph');
    // canvas.width = canvasContainerRect.width;
    // canvas.height = canvasContainerRect.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const canvasData = ctx.getImageData(0, 0, 300, 300);

    function drawPixel (x, y, r, g, b, a) {
      const index = (x + y * canvas.width) * 4;
      canvasData.data[index + 0] = r;
      canvasData.data[index + 1] = g;
      canvasData.data[index + 2] = b;
      canvasData.data[index + 3] = a;
    }
    equiSpiral(spiralShowParams, function(i, iInside, pos) {
      drawPixel(Math.round(pos.x), Math.round(pos.y), 255, 255, 255, 255);
      return iInside <= 3000 && i < 20000;
    });
    ctx.putImageData(canvasData, 0, 0);
  }

  arrange(options);

  function arrange(options) {
    initParams(options);
    return setupImages(options).then(function() {
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
      imageStore.forEach(function(boxData) {
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

      return "fertig";
    });
  }

  function setupProto() {
    if (!Array.prototype.sortBy) {
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

    if (!Array.prototype.findBy) {
      Array.prototype.findBy = (function() {
        return function(prop, value) {
          return this.find(function(item) {
            return value ? item[prop] === value : !!item[prop];
          });
        };
      }());
    }
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
