Vue.component('note-card', {
    props: ['card'],
    template: `
        <div class="card">
            <input 
                type="text" 
                v-model="card.title"
                @blur="validateTitle"
                placeholder="Название"
            >
            <div v-for="(task, i) in card.tasks" :key="i">
                <input 
                    type="checkbox" 
                    v-model="task.completed"
                    :disabled="!task.text.trim()"
                >
                <input 
                    type="text" 
                    v-model.trim="task.text"
                    @blur="validateTask(i)"
                >
                <button 
                    @click="removeTask(i)" 
                    :disabled="card.tasks.length <= 3"
                >-</button>
            </div>
            <button 
                @click="addTask" 
                :disabled="card.tasks.length >= 5"
            >+ Задача</button>
            <div v-if="error" class="error">{{ error }}</div>
        </div>
    `,
    data() {
        return { error: null };
    },
    methods: {
        addTask() {
            this.card.tasks.push({ text: '', completed: false });
            this.$emit('card-updated', this.card);
        },
        removeTask(index) {
            this.card.tasks.splice(index, 1);
            this.$emit('card-updated', this.card);
        },
        validateTitle() {
            if (!this.card.title.trim()) {
                this.error = 'Поле "Название" не может быть пустым.';
            } else {
                this.error = null;
            }
        },
        validateTask(index) {
            if (!this.card.tasks[index].text.trim()) {
                this.error = `Задача ${index + 1} не может быть пустой.`;
            } else {
                this.error = null;
            }
        }
    }
});

Vue.component('task-column', {
    props: ['title', 'cards', 'maxCards', 'columnIndex'],
    template: `
        <div class="column">
            <h2>{{ title }}</h2>
            <button 
                v-if="columnIndex === 0"
                @click="$emit('add-card', columnIndex)" 
                :disabled="cards.length >= maxCards"
            >+ Создать карточку</button>
            <div v-for="card in cards" :key="card.id">
                <note-card 
                    :card="card" 
                    @card-updated="$emit('card-updated', $event)"
                ></note-card>
            </div>
        </div>
    `
});

new Vue({
    el: '#app',
    data: {
        columns: [[], [], []]
    },
    methods: {
        addCard(columnIndex) {
            const newCard = {
                id: Date.now(),
                title: '',
                tasks: Array(3).fill(null).map(() => ({
                    text: '',
                    completed: false
                })),
                column: columnIndex,
                completedAt: null
            };
            this.columns[columnIndex].push(newCard);
        },
        updateCard(updatedCard) {
            const columnIndex = updatedCard.column;
            const cardIndex = this.columns[columnIndex].findIndex(c => c.id === updatedCard.id);
            this.$set(this.columns[columnIndex], cardIndex, updatedCard);
        }
    }
});