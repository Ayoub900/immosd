## Debug Information

Testing different filter approaches:

1. **No filter** (`where: {}`) - Buildings show ✓
2. **`deletedAt: undefined`** - User reported deleted buildings still show
3. **`deletedAt: null`** - No buildings show (suggests field is missing, not null)
4. **`NOT: { deletedAt: { not: null } }`** - No buildings show

## Next Steps

Since `deletedAt: null` doesn't match documents without the field, and `deletedAt: undefined` gets stripped by Prisma, we need to:

1. Check if buildings have deletedAt field at all when created
2. Use proper MongoDB query to filter missing OR null fields
3. Possible solution: Use `isSet` operator or filter in application code

## Hypothesis

Buildings created before soft-delete feature may not have `deletedAt` field at all in MongoDB. The correct filter should match documents where:
- `deletedAt` field doesn't exist (missing)
- OR `deletedAt === null`

But exclude where:
- `deletedAt` is a Date object (soft-deleted)
