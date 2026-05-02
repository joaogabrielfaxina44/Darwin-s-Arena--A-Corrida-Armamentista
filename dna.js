/**
 * Classe DNA
 * Responsável por armazenar e manipular o código genético (Rede Neural).
 */
class DNA {
    constructor(brain) {
        if (brain) {
            this.brain = brain;
        } else {
            // Configuração ampliada: 10 entradas, 16 ocultos, 2 saídas
            this.brain = new NeuralNetwork(10, 16, 2);
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

    /**
     * Crossover genético
     */
    crossover(partner) {
        let newBrain = this.brain.crossover(partner.brain);
        return new DNA(newBrain);
    }
}
