import { h } from 'preact';
import { render, screen, fireEvent } from '@testing-library/preact';
import ExercisesSection from '../src/components/ExercisesSection';
import useAppStore from '../src/store'

// mock the zustand hook
jest.mock('../src/store')
// mock static image import
jest.mock('../src/assets/images/gears.png', () => 'gears.png')

describe('ExercisesSection', () => {
  const mockHandleChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows fallback when there are no exercises', () => {
    useAppStore.mockReturnValue({
      exercises: [],
      currentExercise: null,
      setCurrentExercise: jest.fn(),
    })

    render(<ExercisesSection handleExerciseListChange={mockHandleChange} />)

    // Title fallback
    expect(
      screen.getByText('Selecciona un ejercicio para ver su contenido')
    ).toBeInTheDocument()

    // Disabled option text
    expect(screen.getByText('No hay ejercicios para mostrar')).toBeDisabled()

    // Content fallback
    expect(
      screen.getByText(
        'Cuando selecciones un ejercicio aquí se mostrará su contenido'
      )
    ).toBeInTheDocument()
  })

  it('renders exercises, shows current, and fires change handler', () => {
    const exercises = [
      { id: '1', name: 'First', content: 'lineA\nlineB' },
      { id: '2', name: 'Second', content: 'x\ny' },
    ]
    useAppStore.mockReturnValue({
      exercises,
      currentExercise: exercises[0],
      setCurrentExercise: jest.fn(),
    })

    render(<ExercisesSection handleExerciseListChange={mockHandleChange} />)

    const matches = screen.getAllByText('First')
    expect(matches).toHaveLength(2)

    // The <select> should exist and have the right value
    const select = screen.getByRole('combobox')
    expect(select).toHaveValue('1')

    // The disabled placeholder option
    expect(screen.getByText('Lista de Ejercicios')).toBeDisabled()

    // All exercise options
    expect(screen.getByText('First', { selector: 'option' })).toHaveAttribute('value', '1')
    expect(screen.getByText('Second')).toHaveAttribute('value', '2')

    // Simulate selecting the second exercise
    fireEvent.change(select, { target: { value: '2' } })
    expect(mockHandleChange).toHaveBeenCalledWith('2')

    // And the content is split into paragraphs
    expect(screen.getByText('lineA')).toBeInTheDocument()
    expect(screen.getByText('lineB')).toBeInTheDocument()
  })
})
