// Game state
const gameState = {
    players: [],
    monsters: [],
    combat: {
        active: false,
        playerTeam: [],
        playerTeamMod: 0,
        monsterTeamMod: 0
    },
    nextPlayerId: 1,
    nextMonsterId: 1
};

// DOM Elements
const elements = {
    addPlayerBtn: document.getElementById('add-player-btn'),
    playersContainer: document.getElementById('players-container'),
    startCombatBtn: document.getElementById('start-combat-btn'),
    endCombatBtn: document.getElementById('end-combat-btn'),
    combatContainer: document.getElementById('combat-container'),
    playerTeamContainer: document.getElementById('player-team'),
    monsterTeamContainer: document.getElementById('monster-team'),
    addMonsterBtn: document.getElementById('add-monster-btn'),
    playerTeamPower: document.getElementById('player-team-power'),
    monsterTeamPower: document.getElementById('monster-team-power'),
    playerTeamAddMod: document.getElementById('player-team-add-mod'),
    playerTeamSubMod: document.getElementById('player-team-sub-mod'),
    playerTeamMod: document.getElementById('player-team-mod'),
    monsterTeamAddMod: document.getElementById('monster-team-add-mod'),
    monsterTeamSubMod: document.getElementById('monster-team-sub-mod'),
    monsterTeamMod: document.getElementById('monster-team-mod'),
    calculateBtn: document.getElementById('calculate-btn'),
    playerFinalPower: document.getElementById('player-final-power'),
    monsterFinalPower: document.getElementById('monster-final-power'),
    resultMessage: document.getElementById('result-message')
};

// Templates
const playerTemplate = document.getElementById('player-template');
const monsterTemplate = document.getElementById('monster-template');

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    // Add initial player
    addPlayer();
    
    // Add event listeners
    elements.addPlayerBtn.addEventListener('click', addPlayer);
    elements.startCombatBtn.addEventListener('click', startCombat);
    elements.endCombatBtn.addEventListener('click', endCombat);
    elements.addMonsterBtn.addEventListener('click', addMonster);
    elements.playerTeamAddMod.addEventListener('click', () => updateTeamMod('player', 1));
    elements.playerTeamSubMod.addEventListener('click', () => updateTeamMod('player', -1));
    elements.monsterTeamAddMod.addEventListener('click', () => updateTeamMod('monster', 1));
    elements.monsterTeamSubMod.addEventListener('click', () => updateTeamMod('monster', -1));
    elements.calculateBtn.addEventListener('click', calculateCombatResult);
}

// Player Management
function addPlayer() {
    const playerId = gameState.nextPlayerId++;
    const playerClone = document.importNode(playerTemplate.content, true);
    const playerCard = playerClone.querySelector('.player-card');
    
    playerCard.dataset.playerId = playerId;
    
    // Add event listeners to player card controls
    const levelUpBtn = playerCard.querySelector('.level-up');
    const levelDownBtn = playerCard.querySelector('.level-down');
    const bonusUpBtn = playerCard.querySelector('.bonus-up');
    const bonusDownBtn = playerCard.querySelector('.bonus-down');
    const removeBtn = playerCard.querySelector('.remove-player');
    const joinCombatBtn = playerCard.querySelector('.join-combat');
    const leaveCombatBtn = playerCard.querySelector('.leave-combat');
    
    levelUpBtn.addEventListener('click', () => updatePlayerStat(playerId, 'level', 1));
    levelDownBtn.addEventListener('click', () => updatePlayerStat(playerId, 'level', -1));
    bonusUpBtn.addEventListener('click', () => updatePlayerStat(playerId, 'bonus', 1));
    bonusDownBtn.addEventListener('click', () => updatePlayerStat(playerId, 'bonus', -1));
    removeBtn.addEventListener('click', () => removePlayer(playerId));
    joinCombatBtn.addEventListener('click', () => joinCombat(playerId));
    leaveCombatBtn.addEventListener('click', () => leaveCombat(playerId));
    
    // Add player to game state
    const player = {
        id: playerId,
        name: `Игрок ${playerId}`,
        level: 1,
        bonus: 0,
        power: 1
    };
    
    gameState.players.push(player);
    
    // Set initial values
    playerCard.querySelector('.player-name').value = player.name;
    playerCard.querySelector('.player-name').addEventListener('input', (e) => {
        player.name = e.target.value;
    });
    
    elements.playersContainer.appendChild(playerClone);
}

function updatePlayerStat(playerId, stat, change) {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return;
    
    const playerCard = document.querySelector(`.player-card[data-player-id="${playerId}"]`);
    if (!playerCard) return;
    
    if (stat === 'level') {
        player.level = Math.max(1, player.level + change);
        playerCard.querySelector('.level-value').textContent = player.level;
    } else if (stat === 'bonus') {
        player.bonus = Math.max(0, player.bonus + change);
        playerCard.querySelector('.bonus-value').textContent = player.bonus;
    }
    
    // Update power
    player.power = player.level + player.bonus;
    playerCard.querySelector('.power-value').textContent = player.power;
    
    // Update combat if player is in combat
    if (gameState.combat.active && gameState.combat.playerTeam.includes(playerId)) {
        updateCombatStats();
    }
}

function removePlayer(playerId) {
    // Remove from combat if in combat
    if (gameState.combat.active && gameState.combat.playerTeam.includes(playerId)) {
        leaveCombat(playerId);
    }
    
    // Remove from game state
    gameState.players = gameState.players.filter(p => p.id !== playerId);
    
    // Remove from DOM
    const playerCard = document.querySelector(`.player-card[data-player-id="${playerId}"]`);
    if (playerCard) {
        playerCard.remove();
    }
}

// Combat Management
function startCombat() {
    gameState.combat.active = true;
    gameState.combat.playerTeam = [];
    gameState.combat.playerTeamMod = 0;
    gameState.combat.monsterTeamMod = 0;
    
    // Clear previous combat state
    elements.playerTeamContainer.innerHTML = '';
    elements.monsterTeamContainer.innerHTML = '';
    elements.playerTeamMod.textContent = '0';
    elements.monsterTeamMod.textContent = '0';
    elements.playerTeamPower.textContent = '0';
    elements.monsterTeamPower.textContent = '0';
    elements.playerFinalPower.textContent = '0';
    elements.monsterFinalPower.textContent = '0';
    elements.resultMessage.textContent = 'Начните бой!';
    
    // Show combat container and hide start combat button
    elements.combatContainer.classList.remove('hidden');
    elements.startCombatBtn.classList.add('hidden');
    
    // Show join combat buttons
    document.querySelectorAll('.join-combat').forEach(btn => {
        btn.classList.remove('hidden');
    });
    
    // Add initial monster
    addMonster();
}

function endCombat() {
    gameState.combat.active = false;
    
    // Hide combat container and show start combat button
    elements.combatContainer.classList.add('hidden');
    elements.startCombatBtn.classList.remove('hidden');
    
    // Hide combat buttons
    document.querySelectorAll('.join-combat, .leave-combat').forEach(btn => {
        btn.classList.add('hidden');
    });
    
    // Clear monsters
    gameState.monsters = [];
    gameState.nextMonsterId = 1;
}

function joinCombat(playerId) {
    if (!gameState.combat.active) return;
    
    // Add player to combat team if not already in
    if (!gameState.combat.playerTeam.includes(playerId)) {
        gameState.combat.playerTeam.push(playerId);
        
        // Update UI
        const player = gameState.players.find(p => p.id === playerId);
        const playerCard = document.querySelector(`.player-card[data-player-id="${playerId}"]`);
        
        // Create combat participant element
        const participantEl = document.createElement('div');
        participantEl.classList.add('combat-participant');
        participantEl.dataset.playerId = playerId;
        participantEl.innerHTML = `
            <span class="participant-name">${player.name}</span>
            <span class="participant-power">${player.power}</span>
        `;
        
        elements.playerTeamContainer.appendChild(participantEl);
        
        // Update buttons
        playerCard.querySelector('.join-combat').classList.add('hidden');
        playerCard.querySelector('.leave-combat').classList.remove('hidden');
        
        // Update combat stats
        updateCombatStats();
    }
}

function leaveCombat(playerId) {
    if (!gameState.combat.active) return;
    
    // Remove player from combat team
    gameState.combat.playerTeam = gameState.combat.playerTeam.filter(id => id !== playerId);
    
    // Update UI
    const playerCard = document.querySelector(`.player-card[data-player-id="${playerId}"]`);
    const participantEl = elements.playerTeamContainer.querySelector(`.combat-participant[data-player-id="${playerId}"]`);
    
    if (participantEl) {
        participantEl.remove();
    }
    
    // Update buttons
    playerCard.querySelector('.join-combat').classList.remove('hidden');
    playerCard.querySelector('.leave-combat').classList.add('hidden');
    
    // Update combat stats
    updateCombatStats();
}

function addMonster() {
    const monsterId = gameState.nextMonsterId++;
    const monsterClone = document.importNode(monsterTemplate.content, true);
    const monsterCard = monsterClone.querySelector('.monster-card');
    
    monsterCard.dataset.monsterId = monsterId;
    
    // Add event listeners to monster card controls
    const levelUpBtn = monsterCard.querySelector('.monster-level-up');
    const levelDownBtn = monsterCard.querySelector('.monster-level-down');
    const modUpBtn = monsterCard.querySelector('.monster-mod-up');
    const modDownBtn = monsterCard.querySelector('.monster-mod-down');
    const removeBtn = monsterCard.querySelector('.remove-monster');
    
    levelUpBtn.addEventListener('click', () => updateMonsterStat(monsterId, 'level', 1));
    levelDownBtn.addEventListener('click', () => updateMonsterStat(monsterId, 'level', -1));
    modUpBtn.addEventListener('click', () => updateMonsterStat(monsterId, 'mod', 1));
    modDownBtn.addEventListener('click', () => updateMonsterStat(monsterId, 'mod', -1));
    removeBtn.addEventListener('click', () => removeMonster(monsterId));
    
    // Add monster to game state
    const monster = {
        id: monsterId,
        name: `Монстр ${monsterId}`,
        level: 1,
        mod: 0,
        power: 1
    };
    
    gameState.monsters.push(monster);
    
    // Set initial values
    monsterCard.querySelector('.monster-name').value = monster.name;
    monsterCard.querySelector('.monster-name').addEventListener('input', (e) => {
        monster.name = e.target.value;
        
        // Update combat participant name if in combat
        const participantEl = elements.monsterTeamContainer.querySelector(`.combat-participant[data-monster-id="${monsterId}"]`);
        if (participantEl) {
            participantEl.querySelector('.participant-name').textContent = monster.name;
        }
    });
    
    // Add to monster team container
    elements.monsterTeamContainer.appendChild(monsterClone);
    
    // Create combat participant element
    const participantEl = document.createElement('div');
    participantEl.classList.add('combat-participant');
    participantEl.dataset.monsterId = monsterId;
    participantEl.innerHTML = `
        <span class="participant-name">${monster.name}</span>
        <span class="participant-power">${monster.power}</span>
    `;
    
    elements.monsterTeamContainer.appendChild(participantEl);
    
    // Update combat stats
    updateCombatStats();
}

function updateMonsterStat(monsterId, stat, change) {
    const monster = gameState.monsters.find(m => m.id === monsterId);
    if (!monster) return;
    
    const monsterCard = document.querySelector(`.monster-card[data-monster-id="${monsterId}"]`);
    if (!monsterCard) return;
    
    if (stat === 'level') {
        monster.level = Math.max(1, monster.level + change);
        monsterCard.querySelector('.monster-level-value').textContent = monster.level;
    } else if (stat === 'mod') {
        monster.mod = monster.mod + change;
        monsterCard.querySelector('.monster-mod-value').textContent = monster.mod;
    }
    
    // Update power
    monster.power = monster.level + monster.mod;
    monsterCard.querySelector('.monster-power-value').textContent = monster.power;
    
    // Update combat participant power
    const participantEl = elements.monsterTeamContainer.querySelector(`.combat-participant[data-monster-id="${monsterId}"]`);
    if (participantEl) {
        participantEl.querySelector('.participant-power').textContent = monster.power;
    }
    
    // Update combat stats
    updateCombatStats();
}

function removeMonster(monsterId) {
    // Remove from game state
    gameState.monsters = gameState.monsters.filter(m => m.id !== monsterId);
    
    // Remove from DOM
    const monsterCard = document.querySelector(`.monster-card[data-monster-id="${monsterId}"]`);
    if (monsterCard) {
        monsterCard.remove();
    }
    
    const participantEl = elements.monsterTeamContainer.querySelector(`.combat-participant[data-monster-id="${monsterId}"]`);
    if (participantEl) {
        participantEl.remove();
    }
    
    // Update combat stats
    updateCombatStats();
}

function updateTeamMod(team, change) {
    if (team === 'player') {
        gameState.combat.playerTeamMod += change;
        elements.playerTeamMod.textContent = gameState.combat.playerTeamMod;
    } else if (team === 'monster') {
        gameState.combat.monsterTeamMod += change;
        elements.monsterTeamMod.textContent = gameState.combat.monsterTeamMod;
    }
    
    // Update combat stats
    updateCombatStats();
}

function updateCombatStats() {
    // Calculate player team power
    let playerTeamPower = 0;
    gameState.combat.playerTeam.forEach(playerId => {
        const player = gameState.players.find(p => p.id === playerId);
        if (player) {
            playerTeamPower += player.power;
        }
    });
    
    // Calculate monster team power
    let monsterTeamPower = 0;
    gameState.monsters.forEach(monster => {
        monsterTeamPower += monster.power;
    });
    
    // Update UI
    elements.playerTeamPower.textContent = playerTeamPower;
    elements.monsterTeamPower.textContent = monsterTeamPower;
    
    // Calculate final power with modifiers
    const playerFinalPower = playerTeamPower + gameState.combat.playerTeamMod;
    const monsterFinalPower = monsterTeamPower + gameState.combat.monsterTeamMod;
    
    elements.playerFinalPower.textContent = playerFinalPower;
    elements.monsterFinalPower.textContent = monsterFinalPower;
}

function calculateCombatResult() {
    const playerFinalPower = parseInt(elements.playerFinalPower.textContent);
    const monsterFinalPower = parseInt(elements.monsterFinalPower.textContent);
    
    let resultMessage = '';
    
    if (playerFinalPower > monsterFinalPower) {
        resultMessage = 'Игроки побеждают! 🎉';
        elements.resultMessage.style.backgroundColor = 'var(--success-color)';
        elements.resultMessage.style.color = 'white';
    } else if (playerFinalPower < monsterFinalPower) {
        resultMessage = 'Монстры побеждают! 👹';
        elements.resultMessage.style.backgroundColor = 'var(--danger-color)';
        elements.resultMessage.style.color = 'white';
    } else {
        resultMessage = 'Ничья! Нужны усиления! 🤔';
        elements.resultMessage.style.backgroundColor = 'var(--light-color)';
        elements.resultMessage.style.color = 'var(--dark-color)';
    }
    
    elements.resultMessage.textContent = resultMessage;
}
