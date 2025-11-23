import { prisma } from '../lib/db';
import { MatchStatus, Prisma } from '@prisma/client';
import { EventEmitter } from 'events';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type Format =
  | 'knockout'
  | 'roundrobin'
  | 'groups_then_playoff'
  | 'swiss'
  | 'double_elimination';

type SeedingStrategy =
  | 'registration_order'
  | 'elo_rating'
  | 'historical_performance'
  | 'random'
  | 'manual';

interface FixtureEngineOptions {
  // Randomization options
  randomizeUnseeded?: boolean;
  randomSeed?: number | null;

  // Optimization parameters
  maxSwapIterations?: number;
  optimizationTimeout?: number; // milliseconds

  // Preview/commit options
  dryRun?: boolean;

  // Format-specific options
  groups?: number;
  swissRounds?: number;

  // Seeding configuration
  seedingStrategy?: SeedingStrategy;
  useEloRatings?: boolean;

  // Constraint weights for optimization
  constraintWeights?: ConstraintWeights;

  // Advanced features
  enableAuditLog?: boolean;
  enableRollback?: boolean;
  allowPartialRegeneration?: boolean;

  // Performance options
  batchSize?: number; // for large tournaments
  parallelProcessing?: boolean;

  // Callbacks for progress tracking
  onProgress?: (progress: ProgressUpdate) => void;
  onError?: (error: FixtureError) => void;
}

interface ConstraintWeights {
  sameClubAvoidance: number;      // Weight: 0-1
  balancedBrackets: number;        // Weight: 0-1
  minimizeByes: number;            // Weight: 0-1
  historicalPerformance: number;   // Weight: 0-1
  geographicDistribution: number;  // Weight: 0-1
}

interface PlayerEntry {
  id: string;
  clubId: string | null;
  seed: number | null;
  elo?: number | null;
  historicalWinRate?: number | null;
  preferredCourtIds?: string[];
  unavailableTimeSlots?: Date[];
  originalIndex?: number;
  region?: string | null;
}

interface MatchPlan {
  round: number;
  matchNumber: number;
  playerAId: string | null;
  playerBId: string | null;
  bracketPosition?: number;
  estimatedStartTime?: Date;
  courtId?: string | null;
  isLosersBracket?: boolean; // for double elimination
}

interface GeneratedPreview {
  format: Format;
  matches: Array<Partial<Prisma.MatchCreateInput> & { previewId: string }>;
  metrics: FixtureMetrics;
  previewOnly: boolean;
  warnings?: FixtureWarning[];
  recommendations?: string[];
  fairnessScore?: number; // 0-100 scale
}

interface FixtureMetrics {
  totalPlayers: number;
  bracketSize?: number;
  byes?: number;
  sameClubCollisions: number;
  groups?: number;
  rounds?: number;
  estimatedDuration?: number; // minutes
  fairnessScore: number;
  constraintViolations: ConstraintViolation[];
  optimizationIterations?: number;
}

interface ConstraintViolation {
  type: 'same_club' | 'overlapping_time' | 'insufficient_rest' | 'court_unavailable';
  severity: 'error' | 'warning' | 'info';
  matchIds: string[];
  description: string;
  suggestedFix?: string;
}

interface FixtureWarning {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  affectedEntities: string[];
}

interface ProgressUpdate {
  phase: string;
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // seconds
}

interface FixtureError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
}

interface SwissRoundResult {
  playerId: string;
  wins: number;
  losses: number;
  draws: number;
  buchholzScore?: number;
  opponentIds: string[];
}

interface DoubleEliminationBracket {
  winnersBracket: MatchPlan[];
  losersBracket: MatchPlan[];
  grandFinal: MatchPlan;
}

interface RollbackSnapshot {
  id: string;
  eventId: string;
  timestamp: Date;
  format: Format;
  matches: any[];
  metadata: any;
}

// ============================================================================
// MAIN ENGINE CLASS
// ============================================================================

export class FixtureEngine extends EventEmitter {
  private opts: Required<FixtureEngineOptions>;
  private auditLog: AuditEntry[] = [];
  private rollbackSnapshots: Map<string, RollbackSnapshot> = new Map();
  private performanceMetrics: PerformanceMetrics;

  constructor(options?: FixtureEngineOptions) {
    super();

    this.opts = {
      randomizeUnseeded: options?.randomizeUnseeded ?? false,
      maxSwapIterations: options?.maxSwapIterations ?? 5000,
      optimizationTimeout: options?.optimizationTimeout ?? 30000,
      dryRun: options?.dryRun ?? false,
      groups: options?.groups ?? 0,
      swissRounds: options?.swissRounds ?? 0,
      randomSeed: options?.randomSeed ?? null,
      seedingStrategy: options?.seedingStrategy ?? 'registration_order',
      useEloRatings: options?.useEloRatings ?? false,
      constraintWeights: options?.constraintWeights ?? {
        sameClubAvoidance: 0.8,
        balancedBrackets: 0.6,
        minimizeByes: 0.7,
        historicalPerformance: 0.5,
        geographicDistribution: 0.3
      },
      enableAuditLog: options?.enableAuditLog ?? true,
      enableRollback: options?.enableRollback ?? true,
      allowPartialRegeneration: options?.allowPartialRegeneration ?? true,
      batchSize: options?.batchSize ?? 100,
      parallelProcessing: options?.parallelProcessing ?? false,
      onProgress: options?.onProgress ?? (() => { }),
      onError: options?.onError ?? (() => { })
    };

    this.performanceMetrics = {
      startTime: 0,
      endTime: 0,
      operationCount: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * Main entry point: Generate fixtures for an event
   * 
   * @param eventId - Event identifier
   * @param format - Tournament format
   * @param options - Optional configuration overrides
   * @returns Generated fixture preview or committed matches
   */
  async generateFixtures(
    eventId: string,
    format: Format = 'knockout',
    options?: FixtureEngineOptions
  ): Promise<GeneratedPreview> {
    this.performanceMetrics.startTime = Date.now();
    this.logAudit('FIXTURE_GENERATION_START', { eventId, format });

    try {
      // Merge options
      Object.assign(this.opts, options ?? {});

      // Create rollback snapshot if enabled
      if (this.opts.enableRollback) {
        await this.createRollbackSnapshot(eventId);
      }

      // Validate event and fetch data
      this.emitProgress('validation', 0, 'Validating event...');
      const { event, players } = await this.validateAndFetchEventData(eventId);

      // Validate constraints before generation
      this.emitProgress('validation', 20, 'Validating constraints...');
      const constraintValidation = await this.validateConstraints(eventId, players, format);

      if (constraintValidation.hasErrors) {
        throw new Error(
          `Constraint validation failed: ${constraintValidation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Route to appropriate format handler
      this.emitProgress('generation', 40, `Generating ${format} fixtures...`);
      let result: GeneratedPreview;

      switch (format) {
        case 'knockout':
          result = await this._generateKnockoutWorkflow(eventId, players);
          break;
        case 'roundrobin':
          result = await this._generateRoundRobinWorkflow(eventId, players);
          break;
        case 'groups_then_playoff':
          result = await this._generateGroupsThenPlayoff(eventId, players);
          break;
        case 'swiss':
          result = await this._generateSwissWorkflow(eventId, players);
          break;
        case 'double_elimination':
          result = await this._generateDoubleEliminationWorkflow(eventId, players);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Add warnings and recommendations
      result.warnings = constraintValidation.warnings;
      result.recommendations = this.generateRecommendations(result);

      this.emitProgress('completion', 100, 'Fixtures generated successfully');
      this.logAudit('FIXTURE_GENERATION_COMPLETE', {
        eventId,
        format,
        matchCount: result.matches.length
      });

      this.performanceMetrics.endTime = Date.now();
      return result;

    } catch (error: any) {
      this.logAudit('FIXTURE_GENERATION_ERROR', { eventId, error: error.message });
      this.emitError({
        code: 'GENERATION_FAILED',
        message: error.message,
        details: error,
        recoverable: false
      });
      throw error;
    }
  }

  /**
   * Regenerate specific rounds only (partial regeneration)
   */
  async regenerateRounds(
    eventId: string,
    roundsToRegenerate: number[],
    preserveCompleted: boolean = true
  ): Promise<GeneratedPreview> {
    if (!this.opts.allowPartialRegeneration) {
      throw new Error('Partial regeneration is disabled');
    }

    this.logAudit('PARTIAL_REGENERATION_START', { eventId, rounds: roundsToRegenerate });

    // Fetch existing matches
    const existingMatches = await prisma.match.findMany({
      where: { eventId },
      orderBy: { round: 'asc' }
    });

    // Filter matches to preserve
    const matchesToPreserve = existingMatches.filter(m => {
      if (preserveCompleted && m.status === MatchStatus.COMPLETED) {
        return true;
      }
      return !roundsToRegenerate.includes(m.round);
    });

    // Delete matches in rounds to regenerate
    await prisma.match.deleteMany({
      where: {
        eventId,
        round: { in: roundsToRegenerate },
        status: { not: preserveCompleted ? MatchStatus.COMPLETED : undefined }
      }
    });

    // Regenerate deleted rounds
    // (Implementation would depend on format and requires winner propagation logic)

    this.logAudit('PARTIAL_REGENERATION_COMPLETE', { eventId, rounds: roundsToRegenerate });

    // Return updated preview
    return this.previewFixtures(eventId, 'knockout', { dryRun: true });
  }

  /**
   * Preview fixtures without committing to database
   */
  async previewFixtures(
    eventId: string,
    format: Format,
    options?: FixtureEngineOptions
  ): Promise<GeneratedPreview> {
    return this.generateFixtures(eventId, format, { ...options, dryRun: true });
  }

  /**
   * Rollback to previous fixture state
   */
  async rollback(eventId: string, snapshotId?: string): Promise<boolean> {
    if (!this.opts.enableRollback) {
      throw new Error('Rollback is disabled');
    }

    const snapshot = snapshotId
      ? this.rollbackSnapshots.get(snapshotId)
      : Array.from(this.rollbackSnapshots.values())
        .filter(s => s.eventId === eventId)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    if (!snapshot) {
      throw new Error('No rollback snapshot found');
    }

    this.logAudit('ROLLBACK_START', { eventId, snapshotId: snapshot.id });

    await prisma.$transaction(async (tx) => {
      // Delete current matches
      await tx.match.deleteMany({ where: { eventId } });

      // Restore snapshot matches
      for (const match of snapshot.matches) {
        await tx.match.create({ data: match });
      }
    });

    this.logAudit('ROLLBACK_COMPLETE', { eventId, snapshotId: snapshot.id });
    return true;
  }

  /**
   * Calculate fairness score for generated fixtures
   */
  calculateFairnessScore(preview: GeneratedPreview): number {
    let score = 100;
    const weights = this.opts.constraintWeights;

    // Penalize same-club collisions
    const clubCollisionPenalty =
      (preview.metrics.sameClubCollisions / preview.metrics.totalPlayers) *
      weights.sameClubAvoidance * 40;
    score -= clubCollisionPenalty;

    // Penalize bracket imbalance
    if (preview.metrics.bracketSize) {
      const byeRatio = (preview.metrics.byes ?? 0) / preview.metrics.bracketSize;
      const imbalancePenalty = byeRatio * weights.balancedBrackets * 20;
      score -= imbalancePenalty;
    }

    // Reward even distribution
    const distributionBonus = this.calculateDistributionScore(preview) * 10;
    score += distributionBonus;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Export fixture template for reuse
   */
  async exportTemplate(eventId: string): Promise<FixtureTemplate> {
    const matches = await prisma.match.findMany({
      where: { eventId },
      include: { playerA: true, playerB: true }
    });

    return {
      id: `template-${Date.now()}`,
      name: `Template for Event ${eventId}`,
      format: 'knockout', // This should be fetched from event metadata
      structure: this.analyzeFixtureStructure(matches),
      metadata: {
        totalRounds: Math.max(...matches.map(m => m.round)),
        totalMatches: matches.length,
        createdAt: new Date()
      }
    };
  }

  /**
   * Import and apply fixture template
   */
  async importTemplate(eventId: string, template: FixtureTemplate): Promise<GeneratedPreview> {
    this.logAudit('TEMPLATE_IMPORT_START', { eventId, templateId: template.id });

    // Validate template compatibility
    const { players } = await this.validateAndFetchEventData(eventId);

    if (players.length !== template.structure.expectedPlayerCount) {
      throw new Error(
        `Template expects ${template.structure.expectedPlayerCount} players, but event has ${players.length}`
      );
    }

    // Apply template structure (implementation depends on template format)
    // This would map template positions to actual players

    return this.previewFixtures(eventId, template.format);
  }

  // ============================================================================
  // PRIVATE WORKFLOW METHODS - KNOCKOUT
  // ============================================================================

  private async _generateKnockoutWorkflow(
    eventId: string,
    players: PlayerEntry[]
  ): Promise<GeneratedPreview> {
    const rng = this.rng(this.opts.randomSeed ?? undefined);

    // Determine bracket parameters
    const totalPlayers = players.length;
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));
    const byes = bracketSize - totalPlayers;
    const totalRounds = Math.log2(bracketSize);

    this.emitProgress('knockout', 45, 'Applying seeding strategy...');

    // Apply advanced seeding
    const seededPlayers = await this.applyAdvancedSeeding(players, rng);

    // Distribute players across brackets with optimization
    this.emitProgress('knockout', 55, 'Optimizing bracket distribution...');
    const distributed = await this.distributeWithAdvancedOptimization(
      seededPlayers,
      bracketSize
    );

    // Map to bracket slots using standard seeding order
    const seedOrder = this.getSeedingOrder(bracketSize);
    const bracketSlots: (PlayerEntry | null)[] = new Array(bracketSize).fill(null);

    for (let i = 0; i < seedOrder.length; i++) {
      const seedNum = seedOrder[i];
      if (seedNum <= distributed.length) {
        bracketSlots[i] = distributed[seedNum - 1];
      }
    }

    // Multi-objective optimization
    this.emitProgress('knockout', 70, 'Running multi-objective optimization...');
    const optimizedSlots = await this.multiObjectiveOptimization(
      bracketSlots,
      {
        maxIterations: this.opts.maxSwapIterations,
        timeout: this.opts.optimizationTimeout,
        rng
      }
    );

    // Build match plans
    this.emitProgress('knockout', 85, 'Building match structure...');
    const planMatches = this.buildKnockoutMatchPlans(optimizedSlots, totalRounds);

    // Propagate BYE winners
    this.propagateByeWinners(planMatches);

    // Prepare database payloads
    const createPayloads = planMatches.map((pm, idx) => ({
      eventId,
      round: pm.round,
      matchNumber: pm.matchNumber,
      playerAId: pm.playerAId ?? null,
      playerBId: pm.playerBId ?? null,
      status: pm.status,
      winnerId: pm.winnerId ?? null,
      __tempIndex: idx,
      __nextTempIndex: pm.nextMatchIdx
    }));

    const metrics: FixtureMetrics = {
      totalPlayers,
      bracketSize,
      byes,
      rounds: totalRounds,
      sameClubCollisions: this.countRoundOneSameClubCollisions(optimizedSlots),
      fairnessScore: 0,
      constraintViolations: [],
      optimizationIterations: this.performanceMetrics.operationCount
    };

    const preview: GeneratedPreview = {
      format: 'knockout',
      matches: createPayloads.map(p => ({ ...p as any, previewId: `ko-${p.__tempIndex}` })),
      metrics,
      previewOnly: this.opts.dryRun
    };

    preview.fairnessScore = this.calculateFairnessScore(preview);

    if (this.opts.dryRun) return preview;

    // Commit to database
    this.emitProgress('knockout', 95, 'Committing to database...');
    const createdMatches = await this.commitMatchesToDatabase(createPayloads, eventId);

    return {
      ...preview,
      previewOnly: false,
      matches: createdMatches.map(m => ({ ...m, previewId: m.id }))
    };
  }

  // ============================================================================
  // PRIVATE WORKFLOW METHODS - ROUND ROBIN
  // ============================================================================

  private async _generateRoundRobinWorkflow(
    eventId: string,
    players: PlayerEntry[]
  ): Promise<GeneratedPreview> {
    const rng = this.rng(this.opts.randomSeed ?? undefined);

    this.emitProgress('roundrobin', 50, 'Spreading players by club...');
    const spread = this.spreadPlayersByClub(players, { rng });

    this.emitProgress('roundrobin', 70, 'Building round-robin schedule...');
    const { matchesPlan, metrics } = this.buildRoundRobinPlan(spread);

    const prismaMatches = matchesPlan.map((m, idx) => ({
      eventId,
      round: m.round,
      matchNumber: m.matchNumber,
      playerAId: m.playerAId,
      playerBId: m.playerBId,
      status: MatchStatus.PENDING,
      previewId: `rr-${m.round}-${m.matchNumber}-${idx}`
    }));

    const fixtureMetrics: FixtureMetrics = {
      totalPlayers: players.length,
      sameClubCollisions: metrics.sameClubCollisions,
      rounds: Math.max(...matchesPlan.map(m => m.round)),
      fairnessScore: 0,
      constraintViolations: []
    };

    const preview: GeneratedPreview = {
      format: 'roundrobin',
      matches: prismaMatches.map(m => ({ ...m, previewId: (m as any).previewId })),
      metrics: fixtureMetrics,
      previewOnly: this.opts.dryRun
    };

    preview.fairnessScore = this.calculateFairnessScore(preview);

    if (this.opts.dryRun) return preview;

    this.emitProgress('roundrobin', 90, 'Committing matches...');
    const createdMatches = await prisma.$transaction(
      prismaMatches.map(m => prisma.match.create({
        data: {
          eventId: m.eventId,
          round: m.round,
          matchNumber: m.matchNumber,
          playerAId: m.playerAId,
          playerBId: m.playerBId,
          status: m.status
        }
      }))
    );

    return {
      ...preview,
      previewOnly: false,
      matches: createdMatches.map(m => ({ ...m, previewId: m.id, score: m.score as any, metadata: m.metadata as any }))
    };
  }

  // ============================================================================
  // PRIVATE WORKFLOW METHODS - SWISS SYSTEM
  // ============================================================================

  private async _generateSwissWorkflow(
    eventId: string,
    players: PlayerEntry[]
  ): Promise<GeneratedPreview> {
    const rounds = this.opts.swissRounds || this.calculateOptimalSwissRounds(players.length);

    this.emitProgress('swiss', 50, `Generating ${rounds} Swiss rounds...`);

    // Initialize player records
    const playerRecords = new Map<string, SwissRoundResult>();
    players.forEach(p => {
      playerRecords.set(p.id, {
        playerId: p.id,
        wins: 0,
        losses: 0,
        draws: 0,
        opponentIds: []
      });
    });

    const allMatches: MatchPlan[] = [];

    // Generate each round based on standings
    for (let round = 1; round <= rounds; round++) {
      this.emitProgress('swiss', 50 + (round / rounds) * 40, `Pairing round ${round}...`);

      const roundPairings = this.generateSwissPairings(
        players,
        playerRecords,
        round
      );

      allMatches.push(...roundPairings);
    }

    const prismaMatches = allMatches.map((m, idx) => ({
      eventId,
      round: m.round,
      matchNumber: m.matchNumber,
      playerAId: m.playerAId,
      playerBId: m.playerBId,
      status: MatchStatus.PENDING,
      previewId: `swiss-${m.round}-${m.matchNumber}-${idx}`
    }));

    const metrics: FixtureMetrics = {
      totalPlayers: players.length,
      rounds,
      sameClubCollisions: this.countSameClubMatches(allMatches, players),
      fairnessScore: 0,
      constraintViolations: []
    };

    const preview: GeneratedPreview = {
      format: 'swiss',
      matches: prismaMatches,
      metrics,
      previewOnly: this.opts.dryRun
    };

    preview.fairnessScore = this.calculateFairnessScore(preview);

    if (this.opts.dryRun) return preview;

    const createdMatches = await this.commitMatchesToDatabase(prismaMatches, eventId);

    return {
      ...preview,
      previewOnly: false,
      matches: createdMatches.map(m => ({ ...m, previewId: m.id }))
    };
  }

  // ============================================================================
  // PRIVATE WORKFLOW METHODS - DOUBLE ELIMINATION
  // ============================================================================

  private async _generateDoubleEliminationWorkflow(
    eventId: string,
    players: PlayerEntry[]
  ): Promise<GeneratedPreview> {
    this.emitProgress('double_elimination', 50, 'Building double elimination brackets...');

    const totalPlayers = players.length;
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalPlayers)));

    // Generate winners bracket (same as single elimination)
    const winnersPreview = await this._generateKnockoutWorkflow(eventId, players);

    // Calculate losers bracket structure
    const losersBracketRounds = Math.log2(bracketSize) * 2 - 1;
    const losersBracket: MatchPlan[] = [];

    // Build losers bracket matches
    // (Complex logic: alternate between matches from winners bracket losers and losers bracket progression)
    for (let round = 1; round <= losersBracketRounds; round++) {
      const matchesInRound = Math.pow(2, Math.floor(losersBracketRounds - round));

      for (let m = 0; m < matchesInRound; m++) {
        losersBracket.push({
          round,
          matchNumber: m + 1,
          playerAId: null,
          playerBId: null,
          isLosersBracket: true
        });
      }
    }

    // Grand final (winner of winners bracket vs winner of losers bracket)
    const grandFinal: MatchPlan = {
      round: Math.ceil(Math.log2(bracketSize)) + losersBracketRounds + 1,
      matchNumber: 1,
      playerAId: null,
      playerBId: null
    };

    const allMatches = [
      ...winnersPreview.matches,
      ...losersBracket.map(m => ({
        eventId,
        ...m,
        status: MatchStatus.PENDING,
        previewId: `de-losers-${m.round}-${m.matchNumber}`
      })),
      {
        eventId,
        ...grandFinal,
        status: MatchStatus.PENDING,
        previewId: 'de-grand-final'
      }
    ];

    const metrics: FixtureMetrics = {
      ...winnersPreview.metrics,
      rounds: grandFinal.round,
      fairnessScore: 0,
      constraintViolations: []
    };

    const preview: GeneratedPreview = {
      format: 'double_elimination',
      matches: allMatches,
      metrics,
      previewOnly: this.opts.dryRun
    };

    preview.fairnessScore = this.calculateFairnessScore(preview);

    if (this.opts.dryRun) return preview;

    const createdMatches = await this.commitMatchesToDatabase(allMatches, eventId);

    return {
      ...preview,
      previewOnly: false,
      matches: createdMatches.map(m => ({ ...m, previewId: m.id }))
    };
  }

  // ============================================================================
  // PRIVATE WORKFLOW METHODS - GROUPS THEN PLAYOFF
  // ============================================================================

  private async _generateGroupsThenPlayoff(
    eventId: string,
    players: PlayerEntry[]
  ): Promise<GeneratedPreview> {
    const groups = this.opts.groups > 1
      ? this.opts.groups
      : Math.max(2, Math.floor(players.length / 4));

    const rng = this.rng(this.opts.randomSeed ?? undefined);

    this.emitProgress('groups', 50, `Assigning players to ${groups} groups...`);
    const distributed = this.assignToGroups(players, groups, { rng });

    const groupPlans: Record<string, MatchPlan[]> = {};
    let totalSameClubCollisions = 0;

    // Generate round robin for each group
    for (let g = 0; g < groups; g++) {
      this.emitProgress('groups', 50 + (g / groups) * 30, `Generating group ${g + 1} fixtures...`);

      const grpPlayers = distributed[g];
      const { matchesPlan, metrics } = this.buildRoundRobinPlan(grpPlayers);

      groupPlans[`G${g + 1}`] = matchesPlan.map(m => ({
        ...m,
        playerAId: m.playerAId,
        playerBId: m.playerBId
      }));

      totalSameClubCollisions += metrics.sameClubCollisions;
    }

    const allMatches = Object.entries(groupPlans).flatMap(([gid, matches]) =>
      matches.map((m, idx) => ({
        eventId,
        round: m.round,
        matchNumber: idx + 1,
        playerAId: m.playerAId,
        playerBId: m.playerBId,
        status: MatchStatus.PENDING,
        previewId: `${gid}-${m.round}-${m.matchNumber}`,
        metadata: { groupId: gid }
      }))
    );


    const fixtureMetrics: FixtureMetrics = {
      totalPlayers: players.length,
      groups,
      sameClubCollisions: totalSameClubCollisions,
      rounds: Math.max(...Object.values(groupPlans).flat().map(m => m.round)),
      fairnessScore: 0,
      constraintViolations: []
    };


    const preview: GeneratedPreview = {
      format: 'groups_then_playoff',
      matches: allMatches,
      metrics: fixtureMetrics,
      previewOnly: this.opts.dryRun
    };

    preview.fairnessScore = this.calculateFairnessScore(preview);

    if (this.opts.dryRun) return preview;

    this.emitProgress('groups', 90, 'Committing group matches...');
    const createdMatches = await this.commitMatchesToDatabase(allMatches, eventId);

    return {
      ...preview,
      previewOnly: false,
      matches: createdMatches.map(m => ({ ...m, previewId: m.id }))
    };
  }

  // ============================================================================
  // ADVANCED SEEDING METHODS
  // ============================================================================

  /**
   * Apply advanced seeding strategies based on configuration
   */
  private async applyAdvancedSeeding(
    players: PlayerEntry[],
    rng: () => number
  ): Promise<PlayerEntry[]> {
    switch (this.opts.seedingStrategy) {
      case 'elo_rating':
        return this.seedByEloRating(players);

      case 'historical_performance':
        return await this.seedByHistoricalPerformance(players);

      case 'random':
        return this.seedRandomly(players, rng);

      case 'manual':
        return this.sortAndMaybeRandomizeSeeds(players, { rng });

      case 'registration_order':
      default:
        return this.sortAndMaybeRandomizeSeeds(players, { rng });
    }
  }

  /**
   * Seed players by ELO rating
   */
  private seedByEloRating(players: PlayerEntry[]): PlayerEntry[] {
    const withElo = players.filter(p => p.elo !== null && p.elo !== undefined);
    const withoutElo = players.filter(p => !p.elo);

    // Sort by ELO descending (higher ELO = better seed)
    withElo.sort((a, b) => (b.elo || 0) - (a.elo || 0));

    // Assign seeds to ELO-rated players
    withElo.forEach((p, idx) => {
      p.seed = idx + 1;
    });

    // Append unrated players
    return [...withElo, ...withoutElo];
  }

  /**
   * Seed players based on historical win rate
   */
  private async seedByHistoricalPerformance(
    players: PlayerEntry[]
  ): Promise<PlayerEntry[]> {
    // Fetch historical match data for each player
    const playerStats = await Promise.all(
      players.map(async (p) => {
        const matches = await prisma.match.findMany({
          where: {
            OR: [
              { playerAId: p.id, status: MatchStatus.COMPLETED },
              { playerBId: p.id, status: MatchStatus.COMPLETED }
            ]
          },
          select: {
            playerAId: true,
            playerBId: true,
            winnerId: true
          }
        });

        const wins = matches.filter(m => m.winnerId === p.id).length;
        const total = matches.length;
        const winRate = total > 0 ? wins / total : 0;

        return {
          ...p,
          historicalWinRate: winRate,
          matchesPlayed: total
        };
      })
    );

    // Sort by win rate (with minimum matches threshold)
    const MIN_MATCHES = 5;
    const withHistory = playerStats.filter(p => p.matchesPlayed >= MIN_MATCHES);
    const withoutHistory = playerStats.filter(p => p.matchesPlayed < MIN_MATCHES);

    withHistory.sort((a, b) => (b.historicalWinRate || 0) - (a.historicalWinRate || 0));

    withHistory.forEach((p, idx) => {
      p.seed = idx + 1;
    });

    return [...withHistory, ...withoutHistory];
  }

  /**
   * Completely random seeding
   */
  private seedRandomly(players: PlayerEntry[], rng: () => number): PlayerEntry[] {
    const shuffled = [...players];

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    shuffled.forEach((p, idx) => {
      p.seed = idx + 1;
    });

    return shuffled;
  }

  // ============================================================================
  // MULTI-OBJECTIVE OPTIMIZATION
  // ============================================================================

  /**
   * Advanced multi-objective optimization using simulated annealing
   */
  private async multiObjectiveOptimization(
    slots: (PlayerEntry | null)[],
    options: {
      maxIterations: number;
      timeout: number;
      rng: () => number;
    }
  ): Promise<(PlayerEntry | null)[]> {
    const startTime = Date.now();
    const current = slots.slice();

    let bestSolution = current.slice();
    let bestScore = this.evaluateMultiObjectiveScore(current);

    let temperature = 1.0;
    const coolingRate = 0.995;
    const minTemperature = 0.001;

    let iterations = 0;

    while (
      iterations < options.maxIterations &&
      Date.now() - startTime < options.timeout &&
      temperature > minTemperature
    ) {
      iterations++;
      this.performanceMetrics.operationCount = iterations;

      // Generate neighbor solution by swapping two players
      const neighbor = this.generateNeighborSolution(current, options.rng);
      const neighborScore = this.evaluateMultiObjectiveScore(neighbor);

      // Accept neighbor if better, or with probability based on temperature
      const delta = neighborScore - bestScore;
      const acceptanceProbability = delta > 0 ? 1 : Math.exp(delta / temperature);

      if (options.rng() < acceptanceProbability) {
        current.splice(0, current.length, ...neighbor);

        if (neighborScore > bestScore) {
          bestSolution = neighbor.slice();
          bestScore = neighborScore;
        }
      }

      temperature *= coolingRate;

      // Early termination if perfect score
      if (bestScore >= 99.9) break;
    }

    return bestSolution;
  }

  /**
   * Evaluate multiple objectives and return weighted score
   */
  private evaluateMultiObjectiveScore(slots: (PlayerEntry | null)[]): number {
    const weights = this.opts.constraintWeights;
    let totalScore = 0;

    // Objective 1: Minimize same-club matchups in round 1
    const clubScore = this.evaluateSameClubObjective(slots);
    totalScore += clubScore * weights.sameClubAvoidance * 40;

    // Objective 2: Balance bracket (minimize consecutive byes)
    const balanceScore = this.evaluateBracketBalance(slots);
    totalScore += balanceScore * weights.balancedBrackets * 30;

    // Objective 3: Geographic distribution (if region data available)
    const geoScore = this.evaluateGeographicDistribution(slots);
    totalScore += geoScore * weights.geographicDistribution * 20;

    // Objective 4: Historical performance balance
    const perfScore = this.evaluatePerformanceDistribution(slots);
    totalScore += perfScore * weights.historicalPerformance * 10;

    return totalScore;
  }

  private evaluateSameClubObjective(slots: (PlayerEntry | null)[]): number {
    const collisions = this.countRoundOneSameClubCollisions(slots);
    const maxPossibleCollisions = slots.length / 2;
    return (1 - collisions / maxPossibleCollisions) * 100;
  }

  private evaluateBracketBalance(slots: (PlayerEntry | null)[]): number {
    // Check for clusters of BYEs
    let maxConsecutiveByes = 0;
    let currentByes = 0;

    for (const slot of slots) {
      if (slot === null) {
        currentByes++;
        maxConsecutiveByes = Math.max(maxConsecutiveByes, currentByes);
      } else {
        currentByes = 0;
      }
    }

    // Lower consecutive BYEs = better balance
    const penalty = Math.min(maxConsecutiveByes / slots.length, 1);
    return (1 - penalty) * 100;
  }

  private evaluateGeographicDistribution(slots: (PlayerEntry | null)[]): number {
    // If no region data, return neutral score
    const withRegions = slots.filter(s => s && s.region);
    if (withRegions.length === 0) return 50;

    // Count same-region matchups in round 1
    let sameRegionCount = 0;
    for (let i = 0; i < slots.length; i += 2) {
      const a = slots[i];
      const b = slots[i + 1];
      if (a && b && a.region && b.region && a.region === b.region) {
        sameRegionCount++;
      }
    }

    const maxPossible = slots.length / 2;
    return (1 - sameRegionCount / maxPossible) * 100;
  }

  private evaluatePerformanceDistribution(slots: (PlayerEntry | null)[]): number {
    // Check if high-seed players are well-distributed
    const withSeeds = slots.filter(s => s && s.seed !== null);
    if (withSeeds.length === 0) return 50;

    // Top seeds should be in different quarters of the bracket
    const quarters = 4;
    const quarterSize = slots.length / quarters;
    const topSeedCount = Math.min(quarters, withSeeds.length);

    const quarterDistribution = new Array(quarters).fill(0);

    for (let i = 0; i < slots.length && i < topSeedCount; i++) {
      const slot = slots[i];
      if (slot && slot.seed && slot.seed <= topSeedCount) {
        const quarter = Math.floor(i / quarterSize);
        quarterDistribution[quarter]++;
      }
    }

    // Ideal: one top seed per quarter
    const idealPerQuarter = topSeedCount / quarters;
    const variance = quarterDistribution.reduce((sum, count) =>
      sum + Math.pow(count - idealPerQuarter, 2), 0
    ) / quarters;

    return Math.max(0, 100 - variance * 20);
  }

  /**
   * Generate neighbor solution by swapping two players
   */
  private generateNeighborSolution(
    current: (PlayerEntry | null)[],
    rng: () => number
  ): (PlayerEntry | null)[] {
    const neighbor = current.slice();

    // Select two random non-null positions
    const nonNullIndices = neighbor
      .map((slot, idx) => slot !== null ? idx : -1)
      .filter(idx => idx !== -1);

    if (nonNullIndices.length < 2) return neighbor;

    const idx1 = nonNullIndices[Math.floor(rng() * nonNullIndices.length)];
    const idx2 = nonNullIndices[Math.floor(rng() * nonNullIndices.length)];

    if (idx1 !== idx2) {
      [neighbor[idx1], neighbor[idx2]] = [neighbor[idx2], neighbor[idx1]];
    }

    return neighbor;
  }

  // ============================================================================
  // SWISS SYSTEM SPECIFIC METHODS
  // ============================================================================

  /**
   * Calculate optimal number of Swiss rounds
   */
  private calculateOptimalSwissRounds(playerCount: number): number {
    // Formula: log2(n) rounds typically sufficient
    return Math.ceil(Math.log2(playerCount));
  }

  /**
   * Generate Swiss pairings for a round
   */
  private generateSwissPairings(
    players: PlayerEntry[],
    records: Map<string, SwissRoundResult>,
    round: number
  ): MatchPlan[] {
    // Group players by score
    const scoreGroups = new Map<number, PlayerEntry[]>();

    players.forEach(p => {
      const record = records.get(p.id)!;
      const score = record.wins * 3 + record.draws;

      if (!scoreGroups.has(score)) {
        scoreGroups.set(score, []);
      }
      scoreGroups.get(score)!.push(p);
    });

    // Sort score groups descending
    const sortedScores = Array.from(scoreGroups.keys()).sort((a, b) => b - a);

    const pairings: MatchPlan[] = [];
    let matchNumber = 1;
    const paired = new Set<string>();

    // Pair within each score group
    for (const score of sortedScores) {
      const group = scoreGroups.get(score)!.filter(p => !paired.has(p.id));

      // Try to pair players who haven't played each other
      while (group.length >= 2) {
        const player1 = group.shift()!;
        const record1 = records.get(player1.id)!;

        // Find best opponent (not played before, different club if possible)
        let bestOpponentIdx = -1;
        let bestScore = -1;

        for (let i = 0; i < group.length; i++) {
          const player2 = group[i];
          const record2 = records.get(player2.id)!;

          // Skip if already played
          if (record1.opponentIds.includes(player2.id)) continue;

          let pairingScore = 10;

          // Prefer different clubs
          if (player1.clubId && player2.clubId && player1.clubId !== player2.clubId) {
            pairingScore += 5;
          }

          if (pairingScore > bestScore) {
            bestScore = pairingScore;
            bestOpponentIdx = i;
          }
        }

        if (bestOpponentIdx !== -1) {
          const player2 = group.splice(bestOpponentIdx, 1)[0];

          pairings.push({
            round,
            matchNumber: matchNumber++,
            playerAId: player1.id,
            playerBId: player2.id
          });

          paired.add(player1.id);
          paired.add(player2.id);

          // Update opponent lists
          record1.opponentIds.push(player2.id);
          records.get(player2.id)!.opponentIds.push(player1.id);
        } else {
          // Can't find suitable opponent, carry to next group
          break;
        }
      }
    }

    // Handle any remaining unpaired player (gets BYE)
    const unpaired = players.filter(p => !paired.has(p.id));
    if (unpaired.length === 1) {
      const byePlayer = unpaired[0];
      records.get(byePlayer.id)!.wins++; // Award win for BYE
    }

    return pairings;
  }

  // ============================================================================
  // CONSTRAINT VALIDATION
  // ============================================================================

  /**
   * Validate all constraints before fixture generation
   */
  private async validateConstraints(
    eventId: string,
    players: PlayerEntry[],
    format: Format
  ): Promise<ConstraintValidationResult> {
    const errors: FixtureWarning[] = [];
    const warnings: FixtureWarning[] = [];

    // Constraint 1: Minimum player count
    if (players.length < 2) {
      errors.push({
        code: 'INSUFFICIENT_PLAYERS',
        message: `Minimum 2 players required, found ${players.length}`,
        severity: 'high',
        affectedEntities: [eventId]
      });
    }

    // Constraint 2: Power of 2 for knockout (warning only)
    if (format === 'knockout') {
      const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;
      if (!isPowerOfTwo(players.length)) {
        warnings.push({
          code: 'NON_POWER_OF_TWO',
          message: `Player count (${players.length}) is not a power of 2. BYEs will be added.`,
          severity: 'low',
          affectedEntities: [eventId]
        });
      }
    }

    // Constraint 3: Club distribution analysis
    const clubCounts = new Map<string, number>();
    players.forEach(p => {
      if (p.clubId) {
        clubCounts.set(p.clubId, (clubCounts.get(p.clubId) || 0) + 1);
      }
    });

    const maxClubSize = Math.max(...Array.from(clubCounts.values()));
    if (maxClubSize > players.length / 2) {
      warnings.push({
        code: 'CLUB_CONCENTRATION',
        message: `One club has ${maxClubSize} players (>${players.length / 2}). Same-club matches unavoidable.`,
        severity: 'medium',
        affectedEntities: Array.from(clubCounts.entries())
          .filter(([_, count]) => count === maxClubSize)
          .map(([id, _]) => id)
      });
    }

    // Constraint 4: Seeding consistency
    const seededPlayers = players.filter(p => p.seed !== null);
    const seeds = seededPlayers.map(p => p.seed!);
    const uniqueSeeds = new Set(seeds);

    if (seeds.length !== uniqueSeeds.size) {
      warnings.push({
        code: 'DUPLICATE_SEEDS',
        message: 'Duplicate seed values detected. Seeding may be inconsistent.',
        severity: 'medium',
        affectedEntities: seededPlayers.map(p => p.id)
      });
    }

    // Constraint 5: Format-specific validations
    if (format === 'swiss' && this.opts.swissRounds === 0) {
      warnings.push({
        code: 'SWISS_ROUNDS_AUTO',
        message: `Swiss rounds not specified. Auto-calculated: ${this.calculateOptimalSwissRounds(players.length)} rounds.`,
        severity: 'low',
        affectedEntities: [eventId]
      });
    }

    if (format === 'groups_then_playoff' && this.opts.groups === 0) {
      const autoGroups = Math.max(2, Math.floor(players.length / 4));
      warnings.push({
        code: 'GROUPS_AUTO',
        message: `Group count not specified. Auto-calculated: ${autoGroups} groups.`,
        severity: 'low',
        affectedEntities: [eventId]
      });
    }

    return {
      hasErrors: errors.length > 0,
      hasWarnings: warnings.length > 0,
      errors,
      warnings
    };
  }

  // ============================================================================
  // DATABASE OPERATIONS
  // ============================================================================

  /**
   * Validate event and fetch all required data
   */
  private async validateAndFetchEventData(eventId: string): Promise<{
    event: any;
    players: PlayerEntry[];
  }> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        type: true,
        _count: { select: { matches: true } }
      }
    });

    if (!event) {
      throw new Error('Event not found');
    }

    // Check for active matches
    const matchCount = await prisma.match.count({ where: { eventId } });
    if (matchCount > 0) {
      const active = await prisma.match.findFirst({
        where: {
          eventId,
          status: { in: [MatchStatus.SCHEDULED, MatchStatus.ONGOING] }
        }
      });

      if (active && !this.opts.allowPartialRegeneration) {
        throw new Error('Cannot regenerate fixtures: active matches exist for this event');
      }
    }

    // Fetch registrations with player data
    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: {
        player: {
          select: {
            id: true,
            clubId: true,
            // Assuming these fields exist in your schema
            // elo: true,
            // region: true
          }
        }
      },
      orderBy: { seed: 'asc' }
    });

    if (registrations.length < 2) {
      throw new Error('Not enough registrations to generate fixtures (minimum 2)');
    }

    const players: PlayerEntry[] = registrations.map((r, idx) => ({
      id: r.player.id,
      clubId: r.player.clubId ?? null,
      seed: typeof r.seed === 'number' ? r.seed : null,
      originalIndex: idx,
      // elo: r.player.elo ?? null,
      // region: r.player.region ?? null
    }));

    return { event, players };
  }

  /**
   * Commit matches to database with proper linking
   */
  private async commitMatchesToDatabase(
    payloads: any[],
    eventId: string
  ): Promise<any[]> {
    const createdMatches: any[] = [];

    await prisma.$transaction(async (tx) => {
      // Create all matches first
      for (const payload of payloads) {
        const created = await tx.match.create({
          data: {
            eventId: payload.eventId || eventId,
            round: payload.round,
            matchNumber: payload.matchNumber,
            playerAId: payload.playerAId,
            playerBId: payload.playerBId,
            status: payload.status || MatchStatus.PENDING,
            winnerId: payload.winnerId ?? undefined
          }
        });
        createdMatches[payload.__tempIndex || createdMatches.length] = created;
      }

      // Update nextMatchId links
      for (const payload of payloads) {
        if (payload.__nextTempIndex !== null && payload.__nextTempIndex !== undefined) {
          const child = createdMatches[payload.__tempIndex];
          const parent = createdMatches[payload.__nextTempIndex];

          if (child && parent) {
            await tx.match.update({
              where: { id: child.id },
              data: { nextMatchId: parent.id }
            });
          }
        }
      }
    }, {
      timeout: 30000, // 30 second timeout for large tournaments
      maxWait: 5000
    });

    return createdMatches;
  }

  /**
   * Create rollback snapshot
   */
  private async createRollbackSnapshot(eventId: string): Promise<void> {
    const existingMatches = await prisma.match.findMany({
      where: { eventId }
    });

    if (existingMatches.length > 0) {
      const snapshot: RollbackSnapshot = {
        id: `snapshot-${eventId}-${Date.now()}`,
        eventId,
        timestamp: new Date(),
        format: 'knockout', // This should be fetched from event metadata
        matches: existingMatches,
        metadata: {}
      };

      this.rollbackSnapshots.set(snapshot.id, snapshot);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Build knockout match structure with linking
   */
  private buildKnockoutMatchPlans(
    slots: (PlayerEntry | null)[],
    totalRounds: number
  ): any[] {
    const planMatches: any[] = [];

    // Create all match placeholders
    for (let round = 1; round <= totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);
      for (let m = 0; m < matchesInRound; m++) {
        planMatches.push({
          round,
          matchNumber: m + 1,
          playerAId: null,
          playerBId: null,
          status: MatchStatus.PENDING,
          winnerId: null,
          nextMatchIdx: null
        });
      }
    }

    // Fill round 1 with players from slots
    const round1Count = Math.pow(2, totalRounds - 1);
    for (let m = 0; m < round1Count; m++) {
      const slotA = slots[m * 2];
      const slotB = slots[m * 2 + 1];

      const targetIdx = planMatches.findIndex(
        pm => pm.round === 1 && pm.matchNumber === m + 1
      );

      planMatches[targetIdx].playerAId = slotA ? slotA.id : null;
      planMatches[targetIdx].playerBId = slotB ? slotB.id : null;

      // Handle BYE scenarios
      if ((slotA && !slotB) || (!slotA && slotB)) {
        planMatches[targetIdx].status = MatchStatus.COMPLETED;
        planMatches[targetIdx].winnerId = slotA ? slotA.id : slotB ? slotB.id : null;
      } else if (!slotA && !slotB) {
        planMatches[targetIdx].status = MatchStatus.CANCELLED;
      }
    }

    // Link matches to next round
    const indexMap = new Map<string, number>();
    planMatches.forEach((pm, idx) => {
      indexMap.set(`${pm.round}:${pm.matchNumber}`, idx);
    });

    for (let round = 1; round < totalRounds; round++) {
      const matchesInRound = Math.pow(2, totalRounds - round);
      for (let m = 0; m < matchesInRound; m++) {
        const currentIdx = indexMap.get(`${round}:${m + 1}`)!;
        const parentMatchNum = Math.floor(m / 2) + 1;
        const parentIdx = indexMap.get(`${round + 1}:${parentMatchNum}`)!;
        planMatches[currentIdx].nextMatchIdx = parentIdx;
      }
    }

    return planMatches;
  }

  /**
   * Propagate BYE winners through bracket
   */
  private propagateByeWinners(planMatches: any[]): void {
    for (let i = 0; i < planMatches.length; i++) {
      const pm = planMatches[i];

      if (pm.winnerId && pm.nextMatchIdx !== null) {
        const next = planMatches[pm.nextMatchIdx];
        const isTopFeeder = (pm.matchNumber % 2) === 1;

        if (isTopFeeder) {
          next.playerAId = pm.winnerId;
        } else {
          next.playerBId = pm.winnerId;
        }

        // Reset next match if both players filled
        if (next.playerAId && next.playerBId && next.status === MatchStatus.COMPLETED) {
          next.status = MatchStatus.PENDING;
          next.winnerId = null;
        }
      }
    }
  }

  /**
   * Round robin plan builder (Berger algorithm)
   */
  private buildRoundRobinPlan(players: PlayerEntry[]): {
    matchesPlan: MatchPlan[];
    metrics: { sameClubCollisions: number };
  } {
    let list = players.map(p => ({ ...p }));
    const isOdd = list.length % 2 !== 0;

    if (isOdd) {
      list.push({ id: 'BYE', clubId: null, seed: null } as PlayerEntry);
    }

    const n = list.length;
    const rounds = n - 1;
    const half = n / 2;

    let rotation = [...list];
    const matchesPlan: MatchPlan[] = [];
    let sameClubCollisions = 0;

    for (let r = 0; r < rounds; r++) {
      for (let i = 0; i < half; i++) {
        const p1 = rotation[i];
        const p2 = rotation[n - 1 - i];

        if (!p1 || !p2 || p1.id === 'BYE' || p2.id === 'BYE') continue;

        matchesPlan.push({
          round: r + 1,
          matchNumber: matchesPlan.filter(m => m.round === r + 1).length + 1,
          playerAId: p1.id,
          playerBId: p2.id
        });

        if (p1.clubId && p2.clubId && p1.clubId === p2.clubId) {
          sameClubCollisions++;
        }
      }

      // Rotate (keep first fixed)
      const fixed = rotation[0];
      const rotating = rotation.slice(1);
      rotating.unshift(rotating.pop()!);
      rotation = [fixed, ...rotating];
    }

    return { matchesPlan, metrics: { sameClubCollisions } };
  }

  /**
   * Spread players by club for round robin
   */
  private spreadPlayersByClub(
    players: PlayerEntry[],
    opts: { rng: () => number }
  ): PlayerEntry[] {
    return this.distributeAcrossBuckets(
      players,
      Math.max(4, Math.ceil(players.length / 2))
    );
  }

  /**
   * Distribute players across buckets to minimize club clustering
   */
  private distributeAcrossBuckets(
    players: PlayerEntry[],
    bracketSize: number
  ): PlayerEntry[] {
    const numBuckets = Math.max(4, Math.ceil(bracketSize / 4));
    const buckets: PlayerEntry[][] = Array.from({ length: numBuckets }, () => []);

    // Group by club
    const clubMap = new Map<string, PlayerEntry[]>();
    players.forEach(p => {
      const key = p.clubId || 'UNATTACHED';
      if (!clubMap.has(key)) clubMap.set(key, []);
      clubMap.get(key)!.push(p);
    });

    // Sort clubs by size (largest first)
    const clubs = Array.from(clubMap.entries()).sort((a, b) => b[1].length - a[1].length);

    // Round-robin distribution
    let bucketIdx = 0;
    for (const [_, members] of clubs) {
      for (const member of members) {
        buckets[bucketIdx % numBuckets].push(member);
        bucketIdx++;
      }
    }

    // Flatten buckets
    const distributed: PlayerEntry[] = [];
    let hasProgress = true;

    while (hasProgress) {
      hasProgress = false;
      for (const bucket of buckets) {
        if (bucket.length > 0) {
          distributed.push(bucket.shift()!);
          hasProgress = true;
        }
      }
    }

    return distributed.slice(0, players.length);
  }

  /**
   * Advanced distribution with optimization
   */
  private async distributeWithAdvancedOptimization(
    players: PlayerEntry[],
    bracketSize: number
  ): Promise<PlayerEntry[]> {
    // Start with basic distribution
    let distributed = this.distributeAcrossBuckets(players, bracketSize);

    // Apply additional optimization passes
    distributed = this.optimizeForGeographicBalance(distributed);
    distributed = this.optimizeForPerformanceBalance(distributed);

    return distributed;
  }


  /**
   * Optimize distribution for geographic balance
   */
  private optimizeForGeographicBalance(players: PlayerEntry[]): PlayerEntry[] {
    // If no region data, return as-is
    const withRegions = players.filter(p => p.region);
    if (withRegions.length === 0) return players;

    // Group by region
    const regionMap = new Map<string, PlayerEntry[]>();
    players.forEach(p => {
      const region = p.region || 'UNKNOWN';
      if (!regionMap.has(region)) regionMap.set(region, []);
      regionMap.get(region)!.push(p);
    });

    // Redistribute to spread regions
    const buckets: PlayerEntry[][] = [[], [], [], []];
    let bucketIdx = 0;

    Array.from(regionMap.values()).forEach(regionPlayers => {
      regionPlayers.forEach(p => {
        buckets[bucketIdx % 4].push(p);
        bucketIdx++;
      });
    });

    // Flatten
    const result: PlayerEntry[] = [];
    let hasMore = true;
    while (hasMore) {
      hasMore = false;
      for (const bucket of buckets) {
        if (bucket.length > 0) {
          result.push(bucket.shift()!);
          hasMore = true;
        }
      }
    }

    return result;
  }

  /**
   * Optimize for performance/seed balance
   */
  private optimizeForPerformanceBalance(players: PlayerEntry[]): PlayerEntry[] {
    // Ensure top seeds are distributed across bracket quarters
    const topSeedCount = Math.min(4, players.filter(p => p.seed).length);
    if (topSeedCount === 0) return players;

    const result = [...players];
    const quarterSize = Math.ceil(result.length / 4);

    // Move top 4 seeds to different quarters
    const topSeeds = result
      .filter(p => p.seed && p.seed <= topSeedCount)
      .sort((a, b) => (a.seed || 0) - (b.seed || 0));

    topSeeds.forEach((seed, idx) => {
      const targetQuarter = idx;
      const targetPosition = targetQuarter * quarterSize;

      const currentPosition = result.indexOf(seed);
      if (currentPosition !== targetPosition) {
        result.splice(currentPosition, 1);
        result.splice(targetPosition, 0, seed);
      }
    });

    return result;
  }

  /**
   * Assign players to groups with club spreading
   */
  private assignToGroups(
    players: PlayerEntry[],
    groups: number,
    opts: { rng: () => number }
  ): PlayerEntry[][] {
    const buckets: PlayerEntry[][] = Array.from({ length: groups }, () => []);

    // Group by club
    const clubMap = new Map<string, PlayerEntry[]>();
    players.forEach(p => {
      const key = p.clubId || 'UNATTACHED';
      if (!clubMap.has(key)) clubMap.set(key, []);
      clubMap.get(key)!.push(p);
    });

    // Sort clubs by size
    const clubsSorted = Array.from(clubMap.values()).sort((a, b) => b.length - a.length);

    // Round-robin assignment
    let groupIdx = 0;
    for (const clubPlayers of clubsSorted) {
      for (const player of clubPlayers) {
        buckets[groupIdx % groups].push(player);
        groupIdx++;
      }
    }

    return buckets;
  }

  /**
   * Sort players and optionally randomize unseeded
   */
  private sortAndMaybeRandomizeSeeds(
    players: PlayerEntry[],
    opts: { rng: () => number }
  ): PlayerEntry[] {
    const seeded = players.filter(p => p.seed !== null).sort((a, b) => a.seed! - b.seed!);
    let unseeded = players.filter(p => p.seed === null);

    if (this.opts.randomizeUnseeded) {
      // Fisher-Yates shuffle
      for (let i = unseeded.length - 1; i > 0; i--) {
        const j = Math.floor(opts.rng() * (i + 1));
        [unseeded[i], unseeded[j]] = [unseeded[j], unseeded[i]];
      }
    } else {
      unseeded.sort((a, b) => (a.originalIndex || 0) - (b.originalIndex || 0));
    }

    return [...seeded, ...unseeded];
  }

  /**
   * Get standard seeding order for bracket
   */
  private getSeedingOrder(size: number): number[] {
    if (size === 1) return [1];
    if (size === 2) return [1, 2];

    const half = size / 2;
    const prev = this.getSeedingOrder(half);
    const result: number[] = [];

    for (const s of prev) {
      result.push(s);
      result.push(size + 1 - s);
    }

    return result;
  }

  /**
   * Count same-club collisions in round 1
   */
  private countRoundOneSameClubCollisions(slots: (PlayerEntry | null)[]): number {
    let collisions = 0;
    for (let i = 0; i < slots.length; i += 2) {
      const a = slots[i];
      const b = slots[i + 1];
      if (a && b && a.clubId && b.clubId && a.clubId === b.clubId) {
        collisions++;
      }
    }
    return collisions;
  }

  /**
   * Count same-club matches across all rounds
   */
  private countSameClubMatches(matches: MatchPlan[], players: PlayerEntry[]): number {
    const playerMap = new Map(players.map(p => [p.id, p]));
    let count = 0;

    for (const match of matches) {
      if (!match.playerAId || !match.playerBId) continue;

      const pA = playerMap.get(match.playerAId);
      const pB = playerMap.get(match.playerBId);

      if (pA && pB && pA.clubId && pB.clubId && pA.clubId === pB.clubId) {
        count++;
      }
    }

    return count;
  }

  /**
   * Calculate distribution score
   */
  private calculateDistributionScore(preview: GeneratedPreview): number {
    // Analyze how evenly distributed matches are across rounds
    const roundCounts = new Map<number, number>();

    preview.matches.forEach(m => {
      const round = m.round || 1;
      roundCounts.set(round, (roundCounts.get(round) || 0) + 1);
    });

    if (roundCounts.size === 0) return 0;

    const counts = Array.from(roundCounts.values());
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - avg, 2), 0) / counts.length;

    // Lower variance = better distribution
    return Math.max(0, 1 - variance / (avg * avg));
  }

  /**
   * Analyze fixture structure for template
   */
  private analyzeFixtureStructure(matches: any[]): FixtureStructure {
    const rounds = Math.max(...matches.map(m => m.round));
    const matchesPerRound = new Map<number, number>();

    matches.forEach(m => {
      matchesPerRound.set(m.round, (matchesPerRound.get(m.round) || 0) + 1);
    });

    return {
      rounds,
      matchesPerRound: Object.fromEntries(matchesPerRound),
      expectedPlayerCount: this.inferPlayerCount(matches),
      bracketType: this.inferBracketType(matches)
    };
  }

  /**
   * Infer player count from matches
   */
  private inferPlayerCount(matches: any[]): number {
    const uniquePlayers = new Set<string>();
    matches.forEach(m => {
      if (m.playerAId) uniquePlayers.add(m.playerAId);
      if (m.playerBId) uniquePlayers.add(m.playerBId);
    });
    return uniquePlayers.size;
  }

  /**
   * Infer bracket type from structure
   */
  private inferBracketType(matches: any[]): string {
    const rounds = Math.max(...matches.map(m => m.round));
    const firstRoundMatches = matches.filter(m => m.round === 1).length;

    // Check if power of 2 (knockout pattern)
    const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;

    if (isPowerOfTwo(firstRoundMatches)) {
      return 'knockout';
    }

    // Check for round-robin pattern (all-vs-all)
    const playerCount = this.inferPlayerCount(matches);
    const expectedRRMatches = (playerCount * (playerCount - 1)) / 2;

    if (matches.length === expectedRRMatches) {
      return 'roundrobin';
    }

    return 'custom';
  }

  /**
   * Generate recommendations based on preview
   */
  private generateRecommendations(preview: GeneratedPreview): string[] {
    const recommendations: string[] = [];

    // Recommendation 1: Same-club collisions
    if (preview.metrics.sameClubCollisions > 0) {
      recommendations.push(
        `Consider rerunning with higher maxSwapIterations (current: ${this.opts.maxSwapIterations}) to reduce same-club matches.`
      );
    }

    // Recommendation 2: Fairness score
    if (preview.fairnessScore && preview.fairnessScore < 70) {
      recommendations.push(
        `Fairness score is ${preview.fairnessScore.toFixed(1)}/100. Consider enabling advanced seeding or adjusting constraint weights.`
      );
    }

    // Recommendation 3: BYEs
    if (preview.metrics.byes && preview.metrics.byes > preview.metrics.totalPlayers * 0.25) {
      recommendations.push(
        `High number of BYEs (${preview.metrics.byes}). Consider using a different format like Swiss or Round Robin.`
      );
    }

    // Recommendation 4: Format-specific
    if (preview.format === 'knockout' && preview.metrics.totalPlayers > 64) {
      recommendations.push(
        'Large tournament (64+ players). Consider Swiss format for better player experience and reduced BYEs.'
      );
    }

    if (preview.format === 'roundrobin' && preview.metrics.totalPlayers > 16) {
      recommendations.push(
        'Large round-robin (16+ players). Consider groups-then-playoff format to reduce total match count.'
      );
    }

    return recommendations;
  }

  // ============================================================================
  // PSEUDO-RANDOM NUMBER GENERATOR
  // ============================================================================

  /**
   * Deterministic PRNG (Mulberry32)
   */
  private rng(seed?: number): () => number {
    let t = seed ?? Date.now();
    return () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ============================================================================
  // AUDIT LOGGING
  // ============================================================================

  private logAudit(action: string, details: any): void {
    if (!this.opts.enableAuditLog) return;

    const entry: AuditEntry = {
      timestamp: new Date(),
      action,
      details,
      userId: 'system' // This should be set from context
    };

    this.auditLog.push(entry);

    // Emit event for external logging
    this.emit('audit', entry);
  }

  /**
   * Get audit log
   */
  getAuditLog(): AuditEntry[] {
    return [...this.auditLog];
  }

  /**
   * Clear audit log
   */
  clearAuditLog(): void {
    this.auditLog = [];
  }

  // ============================================================================
  // PROGRESS TRACKING
  // ============================================================================

  private emitProgress(phase: string, progress: number, message: string): void {
    const update: ProgressUpdate = {
      phase,
      progress,
      message,
      estimatedTimeRemaining: this.estimateTimeRemaining(progress)
    };

    this.opts.onProgress(update);
    this.emit('progress', update);
  }

  private emitError(error: FixtureError): void {
    this.opts.onError(error);
    this.emit('error', error);
  }

  private estimateTimeRemaining(currentProgress: number): number {
    if (currentProgress === 0) return 0;

    const elapsed = Date.now() - this.performanceMetrics.startTime;
    const total = (elapsed / currentProgress) * 100;
    return Math.round((total - elapsed) / 1000);
  }

  // ============================================================================
  // PERFORMANCE METRICS
  // ============================================================================

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      ...this.performanceMetrics,
      duration: this.performanceMetrics.endTime - this.performanceMetrics.startTime
    };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics(): void {
    this.performanceMetrics = {
      startTime: 0,
      endTime: 0,
      operationCount: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
  }

  // ============================================================================
  // WINNER PROPAGATION (for match completion)
  // ============================================================================

  /**
   * Propagate winner to next match in bracket
   */
  async propagateWinner(matchId: string, winnerId: string): Promise<void> {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { nextMatch: true }
    });

    if (!match || !match.nextMatch) return;

    const nextMatch = match.nextMatch;
    const isTopFeeder = (match.matchNumber % 2) === 1;

    await prisma.match.update({
      where: { id: nextMatch.id },
      data: {
        [isTopFeeder ? 'playerAId' : 'playerBId']: winnerId
      }
    });

    this.logAudit('WINNER_PROPAGATED', {
      matchId,
      winnerId,
      nextMatchId: nextMatch.id,
      position: isTopFeeder ? 'A' : 'B'
    });
  }

  // ============================================================================
  // BATCH OPERATIONS (for large tournaments)
  // ============================================================================

  /**
   * Process large tournaments in batches
   */
  private async processBatch<T>(
    items: T[],
    processor: (batch: T[]) => Promise<void>
  ): Promise<void> {
    const batchSize = this.opts.batchSize;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await processor(batch);

      // Emit progress
      const progress = Math.round(((i + batch.length) / items.length) * 100);
      this.emitProgress('batch_processing', progress, `Processing batch ${Math.floor(i / batchSize) + 1}`);
    }
  }
}

// ============================================================================
// ADDITIONAL TYPE DEFINITIONS
// ============================================================================

interface ConstraintValidationResult {
  hasErrors: boolean;
  hasWarnings: boolean;
  errors: FixtureWarning[];
  warnings: FixtureWarning[];
}

interface FixtureTemplate {
  id: string;
  name: string;
  format: Format;
  structure: FixtureStructure;
  metadata: {
    totalRounds: number;
    totalMatches: number;
    createdAt: Date;
  };
}

interface FixtureStructure {
  rounds: number;
  matchesPerRound: Record<number, number>;
  expectedPlayerCount: number;
  bracketType: string;
}

interface AuditEntry {
  timestamp: Date;
  action: string;
  details: any;
  userId: string;
}

interface PerformanceMetrics {
  startTime: number;
  endTime: number;
  operationCount: number;
  cacheHits: number;
  cacheMisses: number;
  duration?: number;
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

/**
 * Factory function for creating FixtureEngine instances
 */
export function createFixtureEngine(options?: FixtureEngineOptions): FixtureEngine {
  return new FixtureEngine(options);
}

/**
 * Validate fixture constraints without generating
 */
export async function validateFixtureConstraints(
  eventId: string,
  format: Format,
  options?: FixtureEngineOptions
): Promise<ConstraintValidationResult> {
  const engine = new FixtureEngine(options);
  const { players } = await engine['validateAndFetchEventData'](eventId);
  return engine['validateConstraints'](eventId, players, format);
}

/**
 * Calculate fairness score for existing fixtures
 */
export async function calculateExistingFixtureFairness(
  eventId: string
): Promise<number> {
  const matches = await prisma.match.findMany({
    where: { eventId },
    include: {
      playerA: { select: { clubId: true } },
      playerB: { select: { clubId: true } }
    }
  });

  const totalPlayers = new Set([
    ...matches.map(m => m.playerAId),
    ...matches.map(m => m.playerBId)
  ].filter(Boolean)).size;

  let sameClubCollisions = 0;
  matches.forEach(m => {
    if (
      m.playerA?.clubId &&
      m.playerB?.clubId &&
      m.playerA.clubId === m.playerB.clubId
    ) {
      sameClubCollisions++;
    }
  });

  const preview: GeneratedPreview = {
    format: 'knockout',
    matches: [],
    metrics: {
      totalPlayers,
      sameClubCollisions,
      fairnessScore: 0,
      constraintViolations: []
    },
    previewOnly: true
  };

  const engine = new FixtureEngine();
  return engine.calculateFairnessScore(preview);
}

/**
 * Export default instance
 */
