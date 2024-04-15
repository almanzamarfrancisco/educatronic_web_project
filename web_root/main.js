'use strict';
import { h, html, render, useEffect, useState } from './preact.min.js';

const MainComponent = function (props) {
  const [code, setDefaultCode] = useState(props.config.code || '');

  useEffect(() => {
    setDefaultCode(props.config.code);
  }, [props.config]);
  console.log('props.config.code:', props.config.code)
  const tabs = [
    { label: 'Archivo 1', content: 'Content 1', title: 'Project 1', saved: 'Abril 7, 2024 - 15:03', code: props.config.code || ''},
    { label: 'Archivo 2', content: 'Content 2', title: 'Project 2', saved: 'Abril 15, 2024 - 10:51', code: 'START DOWN 3 OPEN CLOSE DOWN 2 OPEN END' },
  ];
  return html`  
  <!-- Header -->
  <div class="header">
    <h1>Laboratorio Remoto - Educatrónica</h1>
    <h2>ESCOM</h2>
    <p style="font-style: italic;">Construyendo el futuro, <b>aprendiendo hoy</b>: ¡Bienvenidos a Educatrónica!</p>
  </div>
  <!-- Navigation Bar -->
  <div class="navbar">
    <a href="#">Elevador didáctico</a>
    <a href="#">Otro robot</a>
    <a href="#">Un robot más</a>
  </div>
  <!-- The flexible grid (content) -->
  <div class="row">
    <div class="side">
      <h2>Información</h2>
      <p>Escribe el código que quieres ejecutar en el elevador</p>
      <h3>Instrucciones disponibles</h3>
      <p>Estas son las instrucciones que puedes usar</p>
      <p><span style="font-weight: bold">START [n:number]: </span>Inicio</p>
      <p><span style="font-weight: bold">UP [n:number]: </span>Subir n veces</p>
      <p><span style="font-weight: bold">DOWN [n:number]: </span>Bajar n veces</p>
      <p><span style="font-weight: bold">OPEN: </span>Abrir puertas</p>
      <p><span style="font-weight: bold">CLOSE: </span>Cerrar puertas</p>
      <p><span style="font-weight: bold">END: </span>Fin</p>
    </div>
    <div class="main">
      ${h(TabNavigation, {defaultActiveTab:0, tabs:tabs })}
    </div>
  </div>
  
  <!-- Footer -->
  <footer class="footer">
    <h2>ESCOM</h2>
  </footer>
  `;
};

const TextArea = function (props){
  const [text, setText] = useState(props.text || '');

  useEffect(() => {
    setText(props.text);
  }, [props.text]);

  return html`<textarea class="fakeimg" style="height:200px;">
                ${props.text}
              </textarea>`
}

function TabNavigation({ defaultActiveTab, tabs }) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  return html`
    <div>
      ${tabs.map((tab, index) => html `
      ${h(Tab, { active: activeTab === index, onClick: () => setActiveTab(index), label: tab.label })}
      `
      )}
      <div>
        ${h(ArchiveContent, { title: tabs[activeTab].title, saved: tabs[activeTab].saved, code: tabs[activeTab].code })}
        ${tabs[activeTab].content}
        <hr>
        ${h(SendButton, { code: tabs[activeTab].code })}
      </div>
    </div>
  `
}

function Tab({ active, onClick, label }) {
  const style = active ? { fontWeight: 'bold' } : {};

  return html `
    <button style="${style}" onClick="${onClick}">
      ${label}
    </button>
  `
}

function ArchiveContent({ title, saved, code }) {
  return html `
    <h2>${title}</h2>
    <h5>Guardado: ${saved}</h5>
    ${h(TextArea, { text: code })}
    <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. In molestie urna nisl, at viverra arcu posuere egestas.
    </p>
  `
}

function SendButton({ code }) {
  const update = () => {
    console.log('Sending code: ', code)
    fetch('/api/code/exec', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: code
      })
    }).then(r => r.json())
    .catch(err => {
      console.log(err)
      // enable(false);
    });
  }
  return html `
    <input type="button" value="Ejecutar Código" onClick="${update}"/>
  `
}

const App = function (props) {
  const [config, setConfig] = useState({});

  const getconfig = () =>
    fetch('/api/code/get_default')
      .then(r => r.json())
      .then(r => setConfig(r))
      .catch(err => console.log(err));

  useEffect(() => {
    getconfig()
  }, []);

  return html`
  ${h(MainComponent, { config })}
`;
};

window.onload = () => render(h(App), document.body);
