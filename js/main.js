Vue.component('note-card', {
    props: ['card'],
    template: `
        <div style="margin: 10px 0; padding: 10px; border: 1px solid #ccc;">
            <input 
                type="text" 
                v-model="card.title"
                placeholder="Название"
                style="margin-bottom: 10px; width: 100%;"
            >
            <div v-for="(task, i) in card.tasks" :key="i">
                <input type="checkbox" v-model="task.completed">
                <input type="text" v-model="task.text" style="margin: 5px;">
                <button @click="removeTask(i)" :disabled="card.tasks.length <= 3">-</button>
            </div>
            <button 
                @click="addTask" 
                :disabled="card.tasks.length >= 5"
                style="margin-top: 10px;"
            >+ Задача</button>
        </div>
    `,
    methods: {
        addTask() {
            this.card.tasks.push({ text: '', completed: false });
        },
        removeTask(index) {
            this.card.tasks.splice(index, 1);
        }
    }
});

new Vue({
    el: '#app',
    data: {
        columns: [[], [], []],
        isColumn1Blocked: false
    },
    methods: {
        addCard(columnIndex) {
            const newCard = {
                id: Date.now(),
                title: '',
                tasks: Array(3).fill(0).map(() => ({ 
                    text: '', 
                    completed: false 
                })),
                column: columnIndex,
                completedAt: null
            };
            this.columns[columnIndex].push(newCard);
        }
    }
});
