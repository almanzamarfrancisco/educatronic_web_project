import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// import '@testing-library/preact/dont-cleanup-after-each'; // Esto ya lo tenías
// import 'regenerator-runtime/runtime'; // Esto ya lo tenías