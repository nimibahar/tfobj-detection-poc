// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import Webcam from "react-webcam";
import "./App.css";
import { nextFrame } from "@tensorflow/tfjs";
// 2. TODO - Import drawing utility here
import {drawRect} from "./utilities"; 

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Main function
  const runCoco = async () => {
    // 3. TODO - Load network 
    const net = await tf.loadGraphModel('https://nimrodtfpoc.s3.eu-de.cloud-object-storage.appdomain.cloud/model.json')
    
    // Loop and detect hands
    setInterval(() => {
      detect(net);
    }, 16.7);
  };

  const detect = async (net) => {
    // Check data is available
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // 4. TODO - Make Detections
      const img = tf.browser.fromPixels(video)
      const resized = tf.image.resizeBilinear(img, [640,480])
      const casted = resized.cast('int32')
      const expanded = casted.expandDims(0)
      const obj = await net.executeAsync(expanded)

      /**
       * Tensorflow sometime get a bit weird and changes the locations of the 
       * boxes, classes and scores. Those objects should have the following 
       * formats:
       * 
       * boxes: nested array with each inner array having four values between
       * 0 and 1 e.g.
       * [
       *  [0.12, 0.6, 0.92, 1.00],
       *  [0.77, 0.41, 0.85, .22],
       *  [0.43, 0.13, 0.76, .22],
       *  [0.91, 0.92, 0.21, .37]
       * ]
       * 
       * classes: an array of integers e.g.
       * [1, 4, 2, 3]
       * 
       * scores: sorted array with values between 0 and 1 e.g.
       * [0.72, 0.43, 0.28, 0.21]
       */

      // DEBUG
      // console.log(await obj[0].array())
      
      // const boxes = await obj[4].array()
      // const classes = await obj[5].array()
      // const scores = await obj[6].array()

      const boxes = await obj[7].array()
      const classes = await obj[2].array()
      const scores = await obj[0].array()
    
      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");

      // 5. TODO - Update drawing utility
      // drawSomething(obj, ctx)  
      requestAnimationFrame(()=> {
        const confidence = 0.9 // 0 between 1
        drawRect(boxes[0], classes[0], scores[0], confidence, videoWidth, videoHeight, ctx)}
      ); 

      tf.dispose(img)
      tf.dispose(resized)
      tf.dispose(casted)
      tf.dispose(expanded)
      tf.dispose(obj)

    }
  };

  useEffect(()=>{runCoco()},[runCoco]);

  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          muted={true} 
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 8,
            width: 640,
            height: 480,
          }}
        />
      </header>
    </div>
  );
}

export default App;
