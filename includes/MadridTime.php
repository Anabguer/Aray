<?php

declare(strict_types=1);

/**
 * Día jugable y límites diarios según Europe/Madrid (DST incluido).
 * Persistencia de timestamps siempre en UTC.
 */
final class MadridTime
{
    public static function playableTz(): DateTimeZone
    {
        $name = defined('ARAY_TIMEZONE_PLAYABLE') ? ARAY_TIMEZONE_PLAYABLE : 'Europe/Madrid';
        return new DateTimeZone($name);
    }

    public static function utcNow(): DateTimeImmutable
    {
        return new DateTimeImmutable('now', new DateTimeZone('UTC'));
    }

    public static function utcNowString(): string
    {
        return self::utcNow()->format('Y-m-d H:i:s');
    }

    /** Fecha civil del día jugable (Y-m-d) en Madrid. */
    public static function playableDate(?DateTimeInterface $utcMoment = null): string
    {
        $utc = $utcMoment
            ? DateTimeImmutable::createFromInterface($utcMoment)->setTimezone(new DateTimeZone('UTC'))
            : self::utcNow();
        return $utc->setTimezone(self::playableTz())->format('Y-m-d');
    }

    public static function addDaysUtc(int $days): string
    {
        return self::utcNow()->modify(($days >= 0 ? '+' : '') . $days . ' days')->format('Y-m-d H:i:s');
    }

    public static function addMinutesUtc(int $minutes): string
    {
        return self::utcNow()->modify(($minutes >= 0 ? '+' : '') . $minutes . ' minutes')->format('Y-m-d H:i:s');
    }
}
