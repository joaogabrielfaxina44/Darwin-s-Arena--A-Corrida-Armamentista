/**
 * Classe DNA
 * Responsável por armazenar e manipular o código genético (Rede Neural).
 */
class DNA {
    constructor(brain) {
        if (brain) {
            this.brain = brain;
        } else {
            // Configuração padrão: 5 entradas (sensores), 8 neurônios ocultos, 2 saídas (força, rotação)
            this.brain = new NeuralNetwork(8, 12, 2);
        }
    }

    /**
     * Clona o DNA e aplica mutação
     */
    mutate(rate) {
        let newBrain = this.brain.copy();
        newBrain.mutate(rate);
        return new DNA(newBrain);
    }
}
