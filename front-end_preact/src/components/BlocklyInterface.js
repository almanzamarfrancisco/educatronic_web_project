import { h } from 'preact';
import { useEffect } from 'preact/hooks';
import * as Blockly from 'blockly/core';
// Import a generator.
import {javascriptGenerator} from 'blockly/javascript';

const BlocklyInterface = () => {
  useEffect(() => {
    // Step 1: Define Custom Blocks
    Blockly.defineBlocksWithJsonArray([
      {
        "type": "begin",
        "message0": "Begin",
        // "previousStatement": null,
        "nextStatement": null,
        "colour": 120,
      },
      {
        "type": "up",
        "message0": "Up %1 floors",
        "args0": [
          {
            "type": "field_number",
            "name": "FLOORS",
            "value": 1,
            "min": 0,
            "max": 9,
          },
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 230,
      },
      {
        "type": "down",
        "message0": "Down %1 floors",
        "args0": [
          {
            "type": "field_number",
            "name": "FLOORS",
            "value": 1,
            "min": 0,
            "max": 9,
          },
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 230,
      },
      {
        "type": "wait",
        "message0": "Wait %1 seconds",
        "args0": [
          {
            "type": "field_number",
            "name": "SECONDS",
            "value": 1,
            "min": 0,
          },
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 60,
      },
      {
        "type": "end",
        "message0": "End",
        "previousStatement": null,
        // "nextStatement": null,
        "colour": 120,
      },
    ]);
    
    // Step 2: Initialize Blockly Workspace
    const workspace = Blockly.inject('blocklyDiv', {
      toolbox: `
        <xml xmlns="http://www.w3.org/1999/xhtml">
          <block type="begin"></block>
          <block type="up"></block>
          <block type="down"></block>
          <block type="wait"></block>
          <block type="end"></block>
        </xml>
      `,
    });
    javascriptGenerator.forBlock['begin'] = () => {
      return 'Begin\n'; // Simple string for Begin
    };
    javascriptGenerator.forBlock['up'] = (block) => {
      const floors = block.getFieldValue('FLOORS'); // Get the value from the block
      return `Up ${floors}\n`;
    };
    
    javascriptGenerator.forBlock['down'] = (block) => {
      const floors = block.getFieldValue('FLOORS'); // Get the value from the block
      return `Down ${floors}\n`;
    };
    
    javascriptGenerator.forBlock['wait'] = (block) => {
      const seconds = block.getFieldValue('SECONDS'); // Get the value from the block
      return `Wait ${seconds}\n`;
    };
    
    javascriptGenerator.forBlock['end'] = () => {
      return 'End\n'; // Simple string for End
    };
    // Listen for changes and log generated code
    workspace.addChangeListener(() => {
      const code = javascriptGenerator.workspaceToCode(workspace);
      console.log('Generated Code:', code);
    });

    // Step 3: Workspace Cleanup on Component Unmount
    return () => {
      workspace.dispose();
    };
  }, []);

  // Render the Blockly workspace container
  return <div id="blocklyDiv" style={{ height: '500px', width: '100%' }} />;
};

export default BlocklyInterface;
