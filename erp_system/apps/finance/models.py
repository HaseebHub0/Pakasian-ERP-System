from django.db import models


ACCOUNT_TYPES = [
    ('Asset', 'Asset'),
    ('Liability', 'Liability'),
    ('Equity', 'Equity'),
    ('Revenue', 'Revenue'),
    ('Expense', 'Expense'),
]


class Account(models.Model):
    """Chart of Accounts — integer PK matches conventional account code."""
    id = models.IntegerField(primary_key=True, verbose_name='Account Code')
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=20, choices=ACCOUNT_TYPES)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'chart_of_accounts'
        ordering = ['id']

    def __str__(self):
        return f"{self.id} — {self.name} ({self.type})"


class JournalEntry(models.Model):
    """Double-entry journal entries header."""
    date = models.DateField()
    reference = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'journal_entries'
        verbose_name_plural = 'Journal Entries'

    def __str__(self):
        return f"JE {self.pk} — {self.reference} ({self.date})"


class JournalLine(models.Model):
    """Individual debit/credit lines on a journal entry."""
    entry = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='lines')
    account = models.ForeignKey(Account, on_delete=models.PROTECT, db_column='account_id')
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    narration = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = 'journal_lines'

    def __str__(self):
        return f"Line {self.pk} — Dr {self.debit} / Cr {self.credit}"
