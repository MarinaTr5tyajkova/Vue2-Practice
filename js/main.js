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
            <p v-if="card.completedAt">Завершено: {{ new Date(card.completedAt).toLocaleString() }}</p>
        </div>
    `,
    methods: {
    
    }
});

new Vue({
    el: '#app',
    data: {
        columns: [[], [], []],
        isColumn1Blocked: false
    },
    mounted() { 
        this.loadData();
    },
    methods: {
        addCard() {

    }
}
});

new Vue ({
    el: '#app',
    data: {
        collumns: [[], [], []],
        is
    }
})